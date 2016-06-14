//layer-directive.js

angular.module('data-menu')
.directive('rasterlayer', ['MapService', 'DataService', 'LayerAdderService', 'rasterMapLayer', 'rasterDataLayer', function (MapService, DataService, LayerAdderService, rasterMapLayer, rasterDataLayer) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid)
        .then(function (response) {

          MapService.mapLayers.push(rasterMapLayer({
            uuid: scope.layer.uuid,
            url: '/api/v2/wms',
            temporalResolution: 36000,
            styles: {}
          }));

          DataService.dataLayers.push(rasterDataLayer({
            uuid: scope.layer.uuid,
            temporalResolution: 36000,
            aggType: response.aggType,
            scale: response.scale,
            type: response.type,
            quantity: response.quantity,
            unit: response.unit
          }));

          MapService.updateLayers([scope.layer]);
          DataService.refreshSelected([scope.layer]);
        });

        cancelFirstActive();
      }
    });

    scope.$on('$destroy', function () {
      console.log('destroy');
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
