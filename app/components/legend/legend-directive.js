angular.module('lizard-nxt')
.directive('legend', ["LegendService", "State", function(LegendService, State) {

  var _updateData = function (bounds, layers) {
    LegendService.updateLegendData(bounds, layers);
    console.log("LegendService.rasterData:", LegendService.rasterData);
  };

  var link = function (scope, element, attrs) {
    scope.$watch(State.toString('layers.active'), function (n, o) {
      if (n === o) { return; }
      _updateData(scope.state.spatial.bounds, scope.state.layers);
    });
    scope.$watch('state.spatial.bounds', function (n, o) {
      if (n === o) { return; }
      _updateData(n, scope.state.layers);
    });
  };

  return {
    link: link,
    restrict: 'A',
    replace: true
  };
}]);