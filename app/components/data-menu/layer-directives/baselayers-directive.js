//layer-directive.js

angular.module('data-menu')
.directive('baselayers', ['MapService', function (MapService) {
  var link = function (scope) {

    var current;

    scope.$watch('layers.baselayer', function () {
      _.forEach(MapService.BASELAYERS, function (layer, i) {
        if (layer.name.toLowerCase() === scope.layers.baselayer) {
          current = i;
          scope.name = layer.name;
        }
      });
    });

    scope.next = function () {
      current = (current + 1) % (MapService.BASELAYERS.length);
      scope.layers.baselayer = MapService.BASELAYERS[current].name.toLowerCase();
    };

  };

  return {
    link: link,
    scope: {
      layers: '='
    },
    templateUrl: 'data-menu/templates/baselayers.html',
    restrict: 'E',
  };

}]);
