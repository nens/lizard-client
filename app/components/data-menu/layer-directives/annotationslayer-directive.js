//layer-directive.js

angular.module('data-menu')
.directive('annotationsLayer', ['DataService', 'eventseriesDataLayer', function (DataService, eventseriesDataLayer) {
  var link = function (scope) {

    DataService.dataLayers.push(
      eventseriesDataLayer({
        uuid: 'Annotations',
        url: 'api/v2/annotations/'
      })
    );

  };

  return {
    link: link,
    scope: {
      layer: '=',
    },
    templateUrl: 'data-menu/templates/annotations-layer.html',
    restrict: 'E',
  };

}]);
