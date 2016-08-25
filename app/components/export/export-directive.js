
angular.module('export')
.directive('exportSelector', ['ExportService', function (ExportService) {
  var link = function (scope) {
    scope.exportables = ExportService.getExportables();
  };

  return {
    link: link,
    templateUrl: 'export/export-selector.html',
    replace: true,
    restrict: 'E'
  }
}]);
