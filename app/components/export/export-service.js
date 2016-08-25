angular.module('export').service('ExportService', [
  'DataService',
  'AssetService',
  'TimeseriesService',
  function (DataService, AssetService, TimeseriesService) {
    var ExportService = {};

    ExportService.getExportables = function () {
      var _exportables = []

      angular.forEach(DataService.geometries, function (item, name) {
        console.log(item, name)
        _exportables.push(name);
      });

      angular.forEach(TimeseriesService.timeseries, function (item, name) {
        console.log(item, name)
        _exportables.push(name);
      });
      return _exportables;
    };

    return ExportService;
}]);
