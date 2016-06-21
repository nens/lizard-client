//layer-directive.js

angular.module('data-menu')
.directive('rasterlayer', ['MapService', 'DataService', 'LayerAdderService', 'rasterMapLayer', 'rasterDataLayer', function (MapService, DataService, LayerAdderService, rasterMapLayer, rasterDataLayer) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    if (!scope.layer.opacity) { scope.layer.opacity = 1; }

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        scope.layer.active = false;
        LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid)
        .then(function (response) {

          MapService.mapLayers.push(rasterMapLayer({
            uuid: scope.layer.uuid,
            url: 'api/v2/wms/',
            temporalResolution: response.frequency,
            slug: response.slug,
            bounds: response.spatial_bounds,
            temporal: response.temporal,
            wmsOptions: response.options
          }));

          DataService.dataLayers.push(rasterDataLayer({
            uuid: scope.layer.uuid,
            slug: response.slug,
            temporalResolution: 36000,
            aggType: response.aggType,
            scale: response.scale,
            type: response.type,
            quantity: response.quantity,
            unit: response.unit
          }));

          scope.layer.active = true;

          scope.zoomToBounds = LayerAdderService.zoomToBounds.bind({
            bounds: response.spatial_bounds,
            first: response.first_value_timestamp,
            last: response.last_value_timestamp
          });

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
