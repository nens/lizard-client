angular.module('export')
.directive('exportTimeseriesRasters',
        ['user', 'DataService', 'State', 'UtilService', '$timeout', 'gettextCatalog', '$http', 'notie', 'UrlService',
function (user,   DataService,   State,   UtilService,   $timeout,   gettextCatalog,   $http,   notie, UrlService) {

  var DEFAULT_PARAMS = {
    format: "csv",
    srs: "EPSG:4326",
    async: true,
    interactive: true
  };

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
    // Part 1/2 -- get geometries for State.geometries:
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
    // Part 2/2 -- get geometries for State.assets:
    DataService.assets.map(function (asset) {
      var assetKey = asset.entity_name + "$" + asset.id;
      var assetName = asset.name;
      if (State.assets.indexOf(assetKey) > -1) {
        value = UtilService.geomToWkt(asset.geometry);
        totalGeoms[assetName] = value;
      }
     });

    return totalGeoms;
  }

  var urlLanguage = UrlService.getDataForState().language;
  var LanguageLookup = {
    nl: "nl_NL",
    en: "en_GB",
  };
  var defaultLanguageCode = "en_GB";
  var languageCode = LanguageLookup[urlLanguage] || defaultLanguageCode;

  function initDatetimePickers () {
    $timeout(function() {
      // The api wants the time in UTC.
      // Show the time in the export modal in local time
      // and later convert it to UTC time before sending to backend.
      var localFormatter = d3.time.format("%Y-%m-%dT%H:%M");
      var startDateTime = localFormatter(new Date(State.temporal.start));
      var endDateTime = localFormatter(new Date(State.temporal.end));
      $('#start-date-time-picker').datetimepicker({
        date: startDateTime,
        locale: languageCode,
      });
      $('#stop-date-time-picker').datetimepicker({
        date: endDateTime,
        locale: languageCode,
      });
    });
  }

  function getDatetimes () {
    var startDateElem = document.getElementById("start-selector");
    var stopDateElem = document.getElementById("stop-selector");

    var startDate = startDateElem.value.split(" ")[0];
    var startTime = startDateElem.value.split(" ")[1];

    var stopDate = stopDateElem.value.split(" ")[0];
    var stopTime = stopDateElem.value.split(" ")[1];

    var newStartDate = startDate.replace(/\//g, "-").split("-");
    var newStopDate = stopDate.replace(/\//g, "-").split("-");

    // Switch the order from dd-mm-yyyy in the export modal
    // to yyyy-mm-dd for the api call
    var localStartDateTime = newStartDate[2] + '-' + newStartDate[1] + '-' + newStartDate[0] + "T" + startTime + ":00";
    var localStopDateTime = newStopDate[2] + '-' + newStopDate[1] + '-' + newStopDate[0] + "T" + stopTime + ":00";

    // Convert to UTC time before sending to backend
    var utcStartDateTime = (new Date(localStartDateTime)).toISOString();
    var utcStopDateTime = (new Date(localStopDateTime)).toISOString();

    return [utcStartDateTime, utcStopDateTime];
  }

  var link = function (scope) {
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
      var selectedDatetimes = getDatetimes();
      var variableParams = {
        start: selectedDatetimes[0],
        stop:  selectedDatetimes[1],
        geom:  scope.data.selectedGeometry
      };

      // IE doesn't support Object.assign calls....
      _.forEach(variableParams, function (v, k) {
        DEFAULT_PARAMS[k] = v;
      });

      $http.get(
        '/api/v3/rasters/' + scope.data.selectedTemporalRaster + '/data/',
        { params: DEFAULT_PARAMS }
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
