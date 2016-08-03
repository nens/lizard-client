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
            temporalResolution: 36000, // TODO
            aggType: response.aggregation_type,
            scale: 'ratio',
            type: response.type,
            quantity: response.observation_type
              && response.observation_type.parameter_short_display_name,
            unit: response.observation_type
              && response.observation_type.referenced_unit_short_display_name
          }));

          scope.layer.active = true;

          scope.rescale = MapService.rescaleLayers;

          scope.zoomToBounds = LayerAdderService.zoomToBounds.bind({
            bounds: response.spatial_bounds,
            temporal: response.temporal,
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
