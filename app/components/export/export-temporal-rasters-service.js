angular.module('export').service('ExportTemporalRastersService', [
'$http', 'UtilService', 'gettextCatalog',

function ($http, UtilService, gettextCatalog) {

  var service = this;
  var DEFAULT_PARAMS = {
    agg: "sum",
    srs: "EPSG:4326",
    // window: 86400000, // DO WE REALLY WANT (NEED) TO SEND THIS?
    format: "json", // NB! This key will not be used in the backend; i.e, the
                    // format of the exported file will be JSON no matter what
                    // you choose here.
                    ///////////////////////////////////////////////////////////
                    // TODO Roel/Carsten: raster exports in geotiff format.
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

    start = formatter(new Date(start));
    stop = formatter(new Date(stop));

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