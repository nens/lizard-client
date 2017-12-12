angular.module('export')
.directive('exportRasters',
        ['user', 'DataService', 'State', 'UtilService', '$timeout', 'gettextCatalog', '$http', 'notie',
function (user,   DataService,   State,   UtilService,   $timeout,   gettextCatalog,   $http,   notie) {

  var DEFAULT_PARAMS = {
    format: "geotiff",
    srs: "EPSG:4326",
    async: true
  };

  var EXPORT_START_MESSAGE =
    gettextCatalog.getString(
      "Export for raster started, check your inbox.");
  var EXPORT_ERROR_MESSAGE =
    gettextCatalog.getString(
      "Lizard encountered a problem exporting your raster.");

  function getAllRasters () {
    var rasterUUIDs = _.map(_.filter(State.layers, { type: 'raster' }), 'uuid');
    var dataLayers = _.filter(DataService.dataLayers, function (dataLayer) {
      return rasterUUIDs.indexOf(dataLayer.uuid) > -1
    });
    var result = {};
    _.forEach(dataLayers, function (dataLayer) {
      result[dataLayer.slug] = dataLayer.uuid;
    });
    return result;
  }

  function initDatetimePicker () {
    $timeout(function () {
      var localFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M");
      var theDateElem = document.getElementById("datetime-selector");
      if (theDateElem) {
        theDateElem.value = localFormatter(new Date(State.temporal.at));
      }
    });
  }

  function getDatetime () {
    var theDateElem = document.getElementById("datetime-selector");
    return theDateElem.value + ":00";
  }

  function isNumeric (x) { return !isNaN(parseFloat(x)) && isFinite(x) }

  function exportCbAuthenticatedUser (response) {
    angular.element('#MotherModal').modal('hide');
    if (response && response.status === 200) {
      notie.alert(4, EXPORT_START_MESSAGE, 2);
    } else {
      notie.alert(3, EXPORT_ERROR_MESSAGE, 3);
    }
  }

  function link (scope) {

    scope.TARGET_PROJECTIONS = {
      "EPSG:4326 (WGS84)": "EPSG:4326",
      "EPSG:28992 (RD new)": "EPSG:28992"
    };

    scope.isAuthenticated = user.authenticated;
    scope.data = {};
    scope.allRasters = getAllRasters();
    scope.hasRasters = function () { return !!_.size(scope.allRasters) };

    $timeout(function () {
      // Initialize selector #1:
      if (scope.hasRasters) {
        scope.data.selectedRaster = Object.values(scope.allRasters)[0];
      }

      // Initialize selector #2:
      initDatetimePicker();

      // Initialize selector #3:
      scope.data.selectedTargetProjection = "EPSG:4326";

      // Initialize selector #4:
      scope.data.selectedCellSize = 1;
      scope.data.theGeometry = UtilService.geomToWkt(
        UtilService.lLatLngBoundsToGJ(State.spatial.bounds)
      );
    });

    scope.selectedRasterIsTemporal = function () {
      if (!scope.data.selectedRaster) {
        return false;
      } else {
        var dataLayer = _.find(DataService.dataLayers,
          { uuid: scope.data.selectedRaster });
        return !!dataLayer.temporal;
      }
    };

    scope.mayStartExport = function () {
      return scope.data.selectedRaster && isNumeric(scope.data.selectedCellSize);
    };

    scope.startRasterExport = function () {
      var variableParams = {
        geom:       scope.data.theGeometry,
        target_srs: scope.data.selectedTargetProjection,
        cell_size:  scope.data.selectedCellSize
      };

      if (scope.selectedRasterIsTemporal()) {
        variableParams.time = getDatetime();
      }

      var finalParams = Object.assign({}, DEFAULT_PARAMS, variableParams);
      $http.get(
        '/api/v3/rasters/' + scope.data.selectedRaster + '/data/',
        { params: finalParams }
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
  }
}]);