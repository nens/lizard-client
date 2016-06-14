//layer-directive.js

angular.module('data-menu')
.directive('wmslayer', ['MapService', 'LayerAdderService', function (MapService, LayerAdderService) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid)
        .then(function () {

          // Create maplayer, add maplayer to mapservice.

          MapService.updateLayers([scope.layer]);
        });

        cancelFirstActive();
      }
    });

    scope.$on('$destroy', function () {
      // Remove layer from mapLayers and DataService
    });

  };

  return {
    link: link,
    scope: {
      layer: '=',
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };

}]);
