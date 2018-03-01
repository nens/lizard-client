angular.module('export')
.directive('exportTimeseriesRasters',
        ['user', 'DataService', 'State', 'UtilService', '$timeout', 'gettextCatalog', '$http', 'notie',
function (user,   DataService,   State,   UtilService,   $timeout,   gettextCatalog,   $http,   notie) {

  var DEFAULT_PARAMS = {
    format: "csv",
    srs: "EPSG:4326",
    async: true
  };

  var DEFAULT_AGG_TYPE = 'sum';

  var EXPORT_START_MESSAGE =
    gettextCatalog.getString(
      "Export for raster started, check your inbox.");
  var EXPORT_ERROR_MESSAGE =
    gettextCatalog.getString(
      "Lizard encountered a problem exporting your raster.");

  var formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

  var exportCbAuthenticatedUser = function (response) {
    angular.element('#MotherModal').modal('hide');
    if (response && response.status === 200) {
      notie.alert(4, EXPORT_START_MESSAGE, 2);
    } else {
      notie.alert(3, EXPORT_ERROR_MESSAGE, 3);
    }
  };

  function getAllTemporalRasters () {
    var rasterUUIDs = _.map(_.filter(State.layers, { type: 'raster' }), 'uuid');

    var dataLayers = _.filter(DataService.dataLayers, function (dataLayer) {
      return rasterUUIDs.indexOf(dataLayer.uuid) > -1
        && dataLayer.temporal;
    });
    var result = {};
    _.forEach(dataLayers, function (dataLayer) {
      result[dataLayer.slug] = dataLayer.uuid;
    });
    return result;
  }

  function getGOAs () {

    var key, value, totalGeoms = {};

    ///////////////////////////////////////////////////////////////////////////
    // Part 1/n -- get geometries for State.geometries:
    var pointGeoms = _.filter(State.geometries, function (geom) {
      return geom.geometry && geom.geometry.type === 'Point';
    });

    _.forEach(pointGeoms, function (geom) {
      key = "Point: ("
        + geom.geometry.coordinates[1]
        + ", "
        + geom.geometry.coordinates[0]
        + ")";
      value = UtilService.geomToWkt(geom.geometry);
      totalGeoms[key] = value;
    });

    ///////////////////////////////////////////////////////////////////////////
    // Part 2/n -- get geometries for State.assets:
    DataService.assets.map(function (asset) {
      var assetKey = asset.entity_name + "$" + asset.id;
      var assetName = asset.name;
      if (State.assets.indexOf(assetKey) > -1) {
        value = UtilService.geomToWkt(asset.geometry);
        totalGeoms[assetName] = value;
      }
    });

    ///////////////////////////////////////////////////////////////////////////
    // Part 3/n -- get LINESTRING geometries for State.assets -> OMITTED!!!!!

    ///////////////////////////////////////////////////////////////////////////
    // Part 4/n -- get POLYGON geometries for State.geometries:

    var polygonGeoms = _.filter(State.geometries, function (geom) {
      return geom.geometry && (
        geom.geometry.type === 'Polygon' ||
        geom.geometry.type === 'MultiPolygon');
    });

    _.forEach(polygonGeoms, function (geom, idx) {
      key = geom.name || '#' + (idx + 1);
      value = UtilService.geomToWkt(geom.geometry);
      totalGeoms[key] = value;
    });

    var extentGeomVal = UtilService.geomToWkt(
      UtilService.lLatLngBoundsToGJ(State.spatial.bounds)
    );
    var extentGeomKey = 'extent';
    totalGeoms[extentGeomKey] = extentGeomVal;
    return totalGeoms;
  }

  function initDatetimePickers () {
    $timeout(function () {
      var localFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M");

      var startDateElem = document.getElementById("start-selector");
      if (startDateElem) {
        startDateElem.value = localFormatter(new Date(State.temporal.start));
      }

      var stopDateElem = document.getElementById("stop-selector");
      if (stopDateElem) {
        stopDateElem.value = localFormatter(new Date(State.temporal.end));
      }
    });
  }

  function getDatetimes () {
    var startDateElem = document.getElementById("start-selector");
    var stopDateElem = document.getElementById("stop-selector");
    return [startDateElem.value + ":00", stopDateElem.value + ":00"];
  }

  var link = function (scope) {
    console.log("[F] LINK");

    initDatetimePickers();

    scope.isAuthenticated = user.authenticated;
    scope.data = {};

    scope.allTemporalRasters = getAllTemporalRasters();
    scope.hasTemporalRasters = function () {
      return !!_.size(scope.allTemporalRasters);
    };
    scope.allGOAs = getGOAs();
    scope.hasGOAs = function () {
      return !!_.size(scope.allGOAs);
    };

    $timeout(function () {
      if (scope.hasTemporalRasters) {
        scope.data.selectedTemporalRaster =
          Object.values(scope.allTemporalRasters)[0];
      }
      if (scope.hasGOAs) {
        scope.data.selectedGeometry =
          Object.values(scope.allGOAs)[0];
      }
    });

    scope.mayStartExport = function () {
      return scope.data.selectedTemporalRaster && scope.data.selectedGeometry;
    };

    scope.startTimeseriesRasterExport = function () {
      console.log("[F] startTimeseriesRasterExport");

      var selectedDatetimes = getDatetimes();
      var mustAggregate = scope.data.selectedGeometry.indexOf('POLYGON') > -1;

      var variableParams = {
        start: selectedDatetimes[0],
        stop:  selectedDatetimes[1],
        geom:  scope.data.selectedGeometry
      };

      // TRY-OUT!
      ///////////////////////////
      var url;
      if (mustAggregate) {
        variableParams.agg = DEFAULT_AGG_TYPE;
        variableParams.window = 86400000;
        // variableParams.rasters = scope.data.selectedTemporalRaster;
        // url = '/api/v3/raster-aggregates/';
      }
      url = '/api/v3/rasters/' + scope.data.selectedTemporalRaster + '/data/';

      // IE doesn't support Object.assign calls....
      _.forEach(variableParams, function (v, k) {
        DEFAULT_PARAMS[k] = v;
      });

      $http.get(url, { params: DEFAULT_PARAMS }
      ).then(
        exportCbAuthenticatedUser
      );
    };
  };

  return {
    link: link,
    scope: {},
    restrict: 'E',
    replace: true,
    templateUrl: 'export/export-timeseries-rasters.html'
  };
}]);
