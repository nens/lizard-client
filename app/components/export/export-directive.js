
angular.module('export')
.directive('exportSelector', ['DataService', function (DataService) {
  var link = function (scope) {


    scope.assets = DataService.assets;

    scope.toExport = {};

    scope.startExport = function () {
      var uuids =_.map(scope.toExport, function (yes, uuid) {
        if (yes) { return uuid; }
      }).join(',');

      // Request timeseries/data/ with uuids and format=csvzip and async=true

      console.log(scope.toExport, uuids);
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
