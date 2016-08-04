
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
            spatialSelect: MapService.spatialSelect
          }));

          DataService.dataLayers.push(eventseriesDataLayer({
            uuid: scope.layer.uuid,
            url: 'api/v2/events/?event_series=' + scope.layer.uuid
          }));

          MapService.updateLayers([scope.layer]);

          scope.zoomToBounds = LayerAdderService.zoomToBounds.bind({
            bounds: response.spatial_bounds,
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
