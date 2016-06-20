//layer-directive.js

angular.module('data-menu')
.directive('assetlayer', ['MapService', 'LayerAdderService', 'assetMapLayer', function (MapService, LayerAdderService, assetMapLayer) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    if (!scope.layer.opacity) { scope.layer.opacity = 1; }

    // Create maplayer, add maplayer to mapservice.
    MapService.mapLayers.push(assetMapLayer({
      uuid: scope.layer.uuid,
      url: 'api/v2/tiles/' +scope.layer.uuid
    }));

    MapService.updateLayers([scope.layer]);

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
