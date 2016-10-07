
//layer-directive.js

angular.module('data-menu')
.directive('eventseries', ['MapService', 'DataService', 'eventseriesMapLayer', 'eventseriesDataLayer','LayerAdderService', function (MapService, DataService, eventseriesMapLayer, eventseriesDataLayer, LayerAdderService) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    // Set defaults.
    if (!scope.layer.name) {
      scope.layer.name = scope.layer.type + ' ' + scope.layer.uuid;
    }

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        LayerAdderService.fetchLayer(scope.layer.type, scope.layer.uuid, scope.layer.name)
        .then(function (response) {

          // If the layer did not have a name, check if the backend has one.
          if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
            && response.name) {
            scope.layer.name = response.name;
          }

          MapService.mapLayers.push(eventseriesMapLayer({
            color: response.color,
            uuid: scope.layer.uuid,
            url: 'api/v2/events/?event_series=' + scope.layer.uuid,
            spatialSelect: MapService.spatialSelect,
            zIndex: LayerAdderService.getZIndex(scope.layer)
          }));

          DataService.dataLayers.push(eventseriesDataLayer({
            uuid: scope.layer.uuid,
            url: 'api/v2/events/?event_series=' + scope.layer.uuid,
            agg: response.aggregation_type,
            color: response.color,
            scale: response.observation_type
              && response.observation_type.scale,
            quantity: response.observation_type
              && response.observation_type.parameter_short_display_name,
            unit: response.observation_type
              && response.observation_type.referenced_unit_short_display_name
          }));

          MapService.updateLayers([scope.layer]);

          // Zoom to more than the temporal bounds, to at least see all events
          // in the timeline.
          var interval = response.last_value_timestamp
            - response.first_value_timestamp;
          var buffer = interval * 0.1;

          scope.zoomToBounds = LayerAdderService.zoomToBounds.bind({
            bounds: response.spatial_bounds,
            first: response.first_value_timestamp - buffer,
            last: response.last_value_timestamp + buffer,
            temporal: true
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
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };

}]);
