//rasterlayer-directive.js

angular.module('data-menu')
.directive('rasterlayer', ['MapService', 'DataService', 'LayerAdderService',
'rasterMapLayer', 'rasterDataLayer', 'UtilService',

  function (MapService, DataService, LayerAdderService,
  rasterMapLayer, rasterDataLayer, UtilService) {

  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    var mapLayer;

    // Set defaults.
    if (!scope.layer.opacity) { scope.layer.opacity = 1; }
    if (!scope.layer.name) {
      scope.layer.name = scope.layer.type + ' ' + scope.layer.uuid;
    }
    if (scope.layer.vectorized === undefined) {
      scope.layer.vectorized = false;
    }

    scope.rasterLayerIsVectorizable = function (layer) {
      var dataLayer = _.find(DataService.dataLayers, {uuid: layer.uuid});
      if (dataLayer) {
        return (dataLayer.scale === "nominal" ||
          dataLayer.scale === "ordinal");
      } else {
        return false;
      }
    };

    scope.toggleVectorModus = function (layer) {
      layer.vectorized = !layer.vectorized;
      MapService.updateLayers([layer]);
    };

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        scope.layer.active = false;
        LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid, scope.layer.name)
        .then(function (response) {

          mapLayer = rasterMapLayer({
            uuid: scope.layer.uuid,
            url: 'api/v3/wms/',
            slug: response.slug,
            bounds: response.spatial_bounds,
            temporal: response.temporal,
            frequency: response.frequency,
            complexWmsOptions: response.options,
            zIndex: LayerAdderService.getZIndex(scope.layer),
            vectorClickCb: MapService.vectorClickCb
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
              && response.observation_type.parameter,
            unit: response.observation_type
              && response.observation_type.unit,
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

          var dates = UtilService.subtractOffsetUTC(
            [response.first_value_timestamp, response.last_value_timestamp]);
          scope.zoomToBounds = LayerAdderService.zoomToBounds.bind({
            bounds: response.spatial_bounds,
            temporal: response.temporal,
            first: dates[0],
            last: dates[1]
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
