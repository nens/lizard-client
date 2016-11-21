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

    scope.rasterLayerIsVectorizable = function (layer) {
      var dataLayer = _.find(DataService.dataLayers, {uuid: layer.uuid});
      if (dataLayer) {
        return !dataLayer.temporal &&
          (dataLayer.scale === "nominal" || dataLayer.scale === "ordinal");
      } else {
        return false;
      }
    };

    // scope.toggleVectorModus = function (layer) {
    //   var dataLayer = _.find(DataService.dataLayers, {uuid: layer.uuid});
    //   dataLayer.showVectorized = !dataLayer.showVectorized;
    // };

    // scope.showVectorized = function (layer) {
    //   var dataLayer = _.find(DataService.dataLayers, {uuid: layer.uuid});
    //   return !!dataLayer.showVectorized;
    // }

    scope.toggleVectorModus = function (layer) {
      var mapLayer = _.find(MapService.mapLayers, {uuid: layer.uuid});
      mapLayer.showVectorized = !mapLayer.showVectorized;
    };

    scope.showVectorized = function (layer) {
      var mapLayer = _.find(MapService.mapLayers, {uuid: layer.uuid});
      return !!mapLayer.showVectorized;
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
            zIndex: LayerAdderService.getZIndex(scope.layer),
            showVectorized: false
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
            styles: response.options.styles,
            //showVectorized: false
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
