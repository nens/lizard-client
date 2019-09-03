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
      $('#start-date-time-picker').datetimepicker({
        date: new Date(State.temporal.start),
        locale: languageCode,
      });
      $('#stop-date-time-picker').datetimepicker({
        date: new Date(State.temporal.end),
        locale: languageCode,
      });
    });
  }

  function getDatetimes () {
    var startDateElem = document.getElementById("start-selector");
    var stopDateElem = document.getElementById("stop-selector");
    // the value of startDateElem and stopDateElem is a string in date format of "DD-MM-YYYY HH:mm"
    // for NL language and of "DD/MM/YYYY HH:mm" for EN language
    // we would like to have the string in date format of "MM-DD-YYYY HH:mm"
    // so convert these values to the "MM-DD-YYYY HH:mm" format
    // if selected language is EN then split the date by "/"
    // otherwise split the date by "-" (NL language)
    var startDateArray = languageCode === "en_GB" ? startDateElem.value.split("/") : startDateElem.value.split("-");
    var stopDateArray = languageCode === "en_GB" ? stopDateElem.value.split("/") : stopDateElem.value.split("-");
    var newStartDate = startDateArray[1] + "-" + startDateArray[0] + "-" + startDateArray[2];
    var newStopDate = stopDateArray[1] + "-" + stopDateArray[0] + "-" + stopDateArray[2];
    return [newStartDate + ":00", newStopDate + ":00"];
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
