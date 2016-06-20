//layer-directive.js

angular.module('data-menu')
.directive('annotationsLayer', ['DataService', 'eventseriesDataLayer', function (DataService, eventseriesDataLayer) {
  var link = function (scope) {

    DataService.dataLayers.push(
      eventseriesDataLayer({
        uuid: 'annotations',
        url: 'api/v2/annotations/'
      })
    );

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
