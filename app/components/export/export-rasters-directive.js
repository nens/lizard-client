angular.module('export')
.directive('exportRasters',
        ['user', 'DataService', 'State', 'UtilService', '$timeout', 'gettextCatalog', '$http', 'notie', 'ExportRastersService','UrlService',
function (user,   DataService,   State,   UtilService,   $timeout,   gettextCatalog,   $http,   notie,   ExportRastersService, UrlService) {

  var DEFAULT_PARAMS = {
    format: "geotiff",
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

  function _getKey (dataLayer, stateLayer) {
    var rasterName = stateLayer.name;
    if (stateLayer.scenario) {
      var scenario = _.find(State.layers, { uuid: stateLayer.scenario });
      var scenarioName = scenario.name;
      return scenarioName + ":" + rasterName;
    } else {
      return rasterName;
    }
  }

  function getAllRasters () {
    var stateLayer,
        key,
        result = {},
        activeRasterLayers = _.filter(
          State.layers, { type: 'raster', active: true }
        ),
        rasterUUIDs = _.map(activeRasterLayers, 'uuid'),
        dataLayers = _.filter(DataService.dataLayers, function (dataLayer) {
          return rasterUUIDs.indexOf(dataLayer.uuid) > -1;
        });

    // We filter out dataLayers which do not have a geometric (2D) intersection
    // with the current spatial extent of the map:

    _.forEach(dataLayers, function (dataLayer) {

      if (!DataService.layerIntersectsExtent(dataLayer.uuid)) {
        return;
      }

      stateLayer = _.find(State.layers, { uuid: dataLayer.uuid });
      if (stateLayer.type === 'scenario') {
        return;
      }
      key = _getKey(dataLayer, stateLayer);
      result[key] = dataLayer.uuid;
    });

    return result;
  }

  var urlLanguage = UrlService.getDataForState().language;
  var LanguageLookup = {
    nl: "nl_NL",
    en: "en_GB",
  };
  var defaultLanguageCode = "en_GB";
  var languageCode = LanguageLookup[urlLanguage] || defaultLanguageCode;

  function initDatetimePicker () {
    $timeout(function () {
      var localFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M");
      var atDateTime = localFormatter(new Date(State.temporal.at));
      $('#at-date-time-picker').datetimepicker({
        date: atDateTime,
        locale: languageCode,
      });
    });
  }

  function getDatetime () {
    var atDateElem = document.getElementById("at-selector");
    var [atDate, atTime] = atDateElem.value.split(" ");

    var newAtDate = atDate.replace("/", "-");
    //Unfortunately, there is no replace all, so I used a second replace.
    newAtDate = newAtDate.replace("/", "-");
    new2AtDate = newAtDate.split("-");
    return new2AtDate[2] + '-' + new2AtDate[1] + '-' + new2AtDate[0] + "T" + atTime + ":00";
  }

  function isNumeric (x) {
    return !isNaN(parseFloat(x)) && isFinite(x);
  }

  function exportCbAuthenticatedUser (response) {
    angular.element('#MotherModal').modal('hide');
    ExportRastersService.resetSelectedRaster();
    if (response && response.status === 200) {
      notie.alert(4, EXPORT_START_MESSAGE, 2);
    } else {
      notie.alert(3, EXPORT_ERROR_MESSAGE, 3);
    }
  }

  function link (scope) {
    scope.TARGET_PROJECTIONS = {
      "EPSG:28992 (RD new)": "EPSG:28992",
      "EPSG:4326 (WGS84)": "EPSG:4326",
      "EPSG:3857 (Pseudo mercator)": "EPSG:3857"
    };

    scope.context = State.context;
    scope.isAuthenticated = user.authenticated;
    scope.data = {};
    scope.allRasters = getAllRasters();
    scope.hasRasters = function () { return !!_.size(scope.allRasters); };
    scope.getSelectedRaster = ExportRastersService.getSelectedRaster;

    scope.$on('$destroy', ExportRastersService.resetSelectedRaster);

    $timeout(function () {
      // Initialize selector #1:
      if (scope.hasRasters) {
        var firstRaster = Object.values(scope.allRasters)[0];
        ExportRastersService.setSelectedRaster(firstRaster);
      }

      // Initialize selector #2:
      initDatetimePicker();

      // Initialize selector #3:
      scope.data.selectedTargetProjection = "EPSG:28992";

      // Initialize selector #4:
      scope.data.selectedCellSize = 1;
      scope.data.theGeometry = UtilService.geomToWkt(
        UtilService.lLatLngBoundsToGJ(State.spatial.bounds)
      );
    });

    scope.selectedRasterIsTemporal = function () {
      var selectedRaster = ExportRastersService.getSelectedRaster();
      if (!selectedRaster) {
        return false;
      } else {
        var dataLayer = _.find(DataService.dataLayers, { uuid: selectedRaster });
        return !!dataLayer.temporal;
      }
    };

    scope.mayStartExport = function () {
      return ExportRastersService.hasSelectedRaster() &&
        isNumeric(scope.data.selectedCellSize);
    };

    scope.handleSelectBoxChange = function () {
      initDatetimePicker();
      $timeout(function () {
        var selectedOption = $("#rasterExportSelector").find(
          "option:selected")[0];
        var newUuid = selectedOption.value;
        ExportRastersService.setSelectedRaster(newUuid);
      });
    };

    scope.startRasterExport = function () {
      var variableParams = {
        geom:       scope.data.theGeometry,
        target_srs: scope.data.selectedTargetProjection,
        cellsize:   scope.data.selectedCellSize
      };

      if (scope.selectedRasterIsTemporal()) {
        variableParams.time = getDatetime();
      }

      // IE doesn't support Object.assign calls....
      _.forEach(variableParams, function (v, k) {
        DEFAULT_PARAMS[k] = v;
      });

      if (!ExportRastersService.getSelectedRaster()) {
        console.error("[E] unexpected falsy value for: "
          + "ExportRastersService.getSelectedRaster()");
      }

      var url = '/api/v3/rasters/' + ExportRastersService.getSelectedRaster() + '/data/';
      $http.get(url, { params: DEFAULT_PARAMS }
      ).then(
        exportCbAuthenticatedUser
      );
    };
  }

  return {
    link: link,
    scope: {},
    restrict: 'E',
    replace: true,
    templateUrl: 'export/export-rasters.html'
  };
}]);
