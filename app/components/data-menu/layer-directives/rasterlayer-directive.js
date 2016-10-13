//rasterlayer-directive.js

angular.module('data-menu')
.directive('rasterlayer', ['MapService', 'DataService', 'LayerAdderService', 'rasterMapLayer', 'rasterDataLayer', function (MapService, DataService, LayerAdderService, rasterMapLayer, rasterDataLayer) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    // Set defaults.
    if (!scope.layer.opacity) { scope.layer.opacity = 1; }
    if (!scope.layer.name) {
      scope.layer.name = scope.layer.type + ' ' + scope.layer.uuid;
    }

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        scope.layer.active = false;
        LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid, scope.layer.name)
        .then(function (response) {

          var mapLayer = rasterMapLayer({
            uuid: scope.layer.uuid,
            url: 'api/v2/wms/',
            slug: response.slug,
            bounds: response.spatial_bounds,
            temporal: response.temporal,
            frequency: response.frequency,
            complexWmsOptions: response.options,
            zIndex: LayerAdderService.getZIndex(scope.layer)
          });

          MapService.mapLayers.push(mapLayer);

          DataService.dataLayers.push(rasterDataLayer({
            uuid: scope.layer.uuid,
            slug: response.slug,
            temporal: response.temporal,
            agg: response.aggregation_type,
            scale: response.observation_type
              && response.observation_type.scale,
            quantity: response.observation_type
              && response.observation_type.parameter_short_display_name,
            unit: response.observation_type
              && response.observation_type.referenced_unit_short_display_name,
            styles: response.options.styles
          }));

          // If the layer did not have a name, check if the backend has one.
          if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
            && response.name) {
            scope.layer.name = response.name;
          }

          scope.layer.active = true;

          if (response.rescalable) {
            scope.rescale = MapService.rescaleLayer;
          }

          scope.zoomToBounds = LayerAdderService.zoomToBounds.bind({
            bounds: response.spatial_bounds,
            temporal: response.temporal,
            first: response.first_value_timestamp,
            last: response.last_value_timestamp
          });

        })
        .catch(function () {
          scope.invalid = true;
        });

        cancelFirstActive();
      }
    });


    scope.$on('$destroy', function () {
      scope.layer.active = false;
      MapService.updateLayers([scope.layer]);
      _.pull(DataService.dataLayers, {uuid: scope.layer.uuid });
      _.pull(MapService.mapLayers, {uuid: scope.layer.uuid });
    });

  };

  return {
    link: link,
    scope: {
      layer: '=',
      closebutton: '=',
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };


}]);
