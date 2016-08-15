//layer-directive.js

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

          MapService.mapLayers.push(rasterMapLayer({
            uuid: scope.layer.uuid,
            url: 'api/v2/wms/',
            bounds: response.spatial_bounds,
            temporal: response.temporal,
            minFrequency: response.frequency,
            complexWmsOptions: response.options
          }));

          DataService.dataLayers.push(rasterDataLayer({
            uuid: scope.layer.uuid,
            slug: response.slug,
            aggType: response.aggregation_type,
            scale: response.observation_type
              && response.observation_type.scale,
            quantity: response.observation_type
              && response.observation_type.parameter_short_display_name,
            unit: response.observation_type
              && response.observation_type.referenced_unit_short_display_name
          }));

          // If the layer did not have a name, check if the backend has one.
          if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
            && response.name) {
            scope.layer.name = response.name;
          }

          scope.layer.active = true;

          scope.rescale = MapService.rescaleLayers;

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
      _.pull(DataService.dataLayers, {uuid: scope.layer.uuid });
      _.pull(MapService.mapLayers, {uuid: scope.layer.uuid });
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
