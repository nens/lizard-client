angular.module('export')
.directive('exportTimeseriesRasters',
        ['user', 'DataService', 'State', 'UtilService', '$timeout', 'gettextCatalog', '$http', 'notie',
function (user,   DataService,   State,   UtilService,   $timeout,   gettextCatalog,   $http,   notie) {

  // LEXUS_URL = https://demo.lizard.net/api/v3/rasters/730d6675-35dd-4a35-aa9b-bfb8155f9ca7/data/?format=csv&start=&stop=&geom=POINT(lon, lat)&srs=EPSG:4326

  var RAIN_UUID = "730d6675-35dd-4a35-aa9b-bfb8155f9ca7";

  var DEFAULT_PARAMS = {
    format: "csv",
    srs: "EPSG:4326",
    async: true
  };

  var EXPORT_START_MESSAGE =
    gettextCatalog.getString(
      "Export for raster started, check your inbox.");
  // var EXPORT_SUCCESS_MESSAGE =
  //   gettextCatalog.getString(
  //     "Export for raster finished succesfully.");
  var EXPORT_ERROR_MESSAGE =
    gettextCatalog.getString(
      "Lizard encountered a problem exporting your raster.");

  var formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

  var exportCbAuthenticatedUser = function (response) {
    console.log("[F] exportCbAuthenticatedUser; response =", response);
    angular.element('#MotherModal').modal('hide');
    if (response && response.status === 200) {
      console.log("*** AAA");
      notie.alert(4, EXPORT_START_MESSAGE, 2);
    } else {
      console.log("*** BBB");
      notie.alert(3, EXPORT_ERROR_MESSAGE, 3);
    }
  };

  function getTemporalRasters () {
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
    // Part 1/2 -- get geometries for State.geometries:
    pointGeoms = _.filter(State.geometries, function (geom) {
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
    // Part 2/2 -- get geometries for State.assets:
    DataService.assets.map(function (asset) {
      key = asset.entity_name + "$" + asset.id;
      if (State.assets.indexOf(key) > -1) {
        value = UtilService.geomToWkt(asset.geometry);
        totalGeoms[key] = value;
      }
     });

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
    initDatetimePickers();

    scope.isAuthenticated = user.authenticated;
    scope.data = {};

    scope.allTemporalRasters = getTemporalRasters();
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
      var selectedDatetimes = getDatetimes();
      var variableParams = {
        start: selectedDatetimes[0],
        stop:  selectedDatetimes[1],
        geom:  scope.data.selectedGeometry
      };
      var finalParams = Object.assign({}, DEFAULT_PARAMS, variableParams);

      $http.get(
        '/api/v3/rasters/' + scope.data.selectedTemporalRaster + '/data/',
        { params: finalParams }
      ).then(
        exportCbAuthenticatedUser
      );
    }
  };

  return {
    link: link,
    scope: {},
    restrict: 'E',
    replace: true,
    templateUrl: 'export/export-timeseries-rasters.html'
  }
}]);