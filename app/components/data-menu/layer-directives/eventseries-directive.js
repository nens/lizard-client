
//layer-directive.js

angular.module('data-menu')
.directive('eventseries', ['MapService', 'eventseriesMapLayer', 'LayerAdderService', function (MapService, eventseriesMapLayer, LayerAdderService) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        LayerAdderService.fetchLayer(scope.layer.type, scope.layer.uuid)
        .then(function (response) {

          MapService.mapLayers.push(eventseriesMapLayer({
            color: response.color,
            uuid: scope.layer.uuid,
            url: 'api/v2/events/?event_series=' + scope.layer.uuid
          }));

          MapService.updateLayers([scope.layer]);
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
