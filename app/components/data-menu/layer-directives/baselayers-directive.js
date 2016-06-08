//layer-directive.js

angular.module('data-menu')
.directive('baselayers', ['MapService', function (MapService) {
  var link = function (scope) {

    scope.next = function () {

      var currentLayer = _.find(MapService.BASELAYERS, function (layer) {
        return layer.id === scope.layers.baselayer;
      });

      var currentIndex = _.indexOf(MapService.BASELAYERS, currentLayer);
      var next = (currentIndex + 1) % (MapService.BASELAYERS.length);

      scope.layers.baselayer = MapService.BASELAYERS[next].id;

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
