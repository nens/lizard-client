angular.module('export').service('ExportTemporalRastersService', [
'$http', 'UtilService', 'gettextCatalog',

function ($http, UtilService, gettextCatalog) {

  var service = this;
  var DEFAULT_PARAMS = {
    agg: "sum",
    srs: "EPSG:4326",
    window: 86400000,
    format: "xlsx", // TODO: geotiff???
    async: true
  };

  var EXPORT_START_MESSAGE =
    gettextCatalog.getString(
      "Export for raster started, check your inbox.");
  var EXPORT_SUCCESS_MESSAGE =
    gettextCatalog.getString(
      "Export for raster finished succesfully.");
  var EXPORT_ERROR_MESSAGE =
    gettextCatalog.getString(
      "Lizard encountered a problem exporting your raster.");

  var formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

  service.startExport = function (start, stop, rasterUuid, geometry) {
    console.log("[F] startExport");

    start = formatter(new Date(start));
    stop  = formatter(new Date(stop));

    var variableParams = {
      start: start,
      stop: stop,
      rasters: rasterUuid,
      geom: UtilService.geomToWkt(geometry)
    };

    var finalParams = Object.assign({}, DEFAULT_PARAMS, variableParams);

    var exportCbAuthenticatedUser = function (response) {
      angular.element('#MotherModal').modal('hide');
      if (response && response.status === 200) {
        notie.alert(4, EXPORT_START_MESSAGE, 2);
      } else {
        notie.alert(3, EXPORT_ERROR_MESSAGE, 3);
      }
    };

    $http.get('/api/v3/raster-aggregates/', { params: finalParams })
      .then(exportCbAuthenticatedUser);
  };

  return service;
}]);