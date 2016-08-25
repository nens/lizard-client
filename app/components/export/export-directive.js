
angular.module('export')
.directive('exportSelector', ['DataService', function (DataService) {
  var link = function (scope) {

    scope.assets = DataService.assets;

  scope.export = function (assets) {
    console.log(assets);
  };

  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-selector.html',
    replace: true,
    restrict: 'E'
  };
}]);
