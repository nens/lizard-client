//layer-directive.js

angular.module('data-menu')
.directive('baselayers', ['MapService', function (MapService) {
  var link = function (scope) {

    scope.next = function () {

      var currentLayer = _.find(MapService.baselayers, function (layer) {
        return layer.id === scope.state.baselayer;
      });

      var currentIndex = _.indexOf(MapService.baselayers, currentLayer);
      var next = (currentIndex + 1) % (MapService.baselayers.length);

      scope.state.baselayer = MapService.baselayers[next].id;

    };

  };

  return {
    link: link,
    scope: { state: '=' },
    templateUrl: 'data-menu/templates/baselayers.html',
    restrict: 'E',
  };

}]);
