angular.module('lizard-nxt')
.directive('legend', ["LegendService", "State", function(LegendService, State) {

  var link = function (scope, element, attrs) {

    scope.$watch(State.toString('layers.active'), function (n, o) {
      if (n === o) { return; }
      LegendService.updateLegendData(scope.state.spatial.bounds, scope.state.layers);
      console.log("[dbg] LegendService.rasterData (i):", LegendService.rasterData);
    });

    scope.$watch('state.spatial.bounds', function (n, o) {
      if (n === o) { return; }
      LegendService.updateLegendData(n, scope.state.layers);
      console.log("[dbg] LegendService.rasterData (ii):", LegendService.rasterData);
    });
  };

  return {
    link: link,
    restrict: 'A',
    replace: true
  };
}]);