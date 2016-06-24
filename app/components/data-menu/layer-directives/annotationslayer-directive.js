//layer-directive.js

angular.module('data-menu')
.directive('annotationsLayer', ['DataService', 'MapService', 'eventseriesDataLayer', 'eventseriesMapLayer', function (DataService, MapService, eventseriesDataLayer, eventseriesMapLayer) {
  var link = function (scope) {

    MapService.annotationsLayer = eventseriesMapLayer({
      color: '#e67e22', // Orange
      uuid: 'annotations',
      url: 'api/v2/annotations/',
      spatialSelect: MapService.spatialSelect
    });

    DataService.annotationsLayer = eventseriesDataLayer({
      uuid: 'annotations',
      url: 'api/v2/annotations/'
    });

  };

  return {
    link: link,
    scope: {
      annotations: '=',
    },
    templateUrl: 'data-menu/templates/annotations-layer.html',
    restrict: 'E',
  };

}]);
