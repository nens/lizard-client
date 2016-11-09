angular.module('legend')
.directive('legend', ["LegendService", "State", function(LegendService, State) {

  // When using this directive to actually draw the legend in the browser, you
  // only need to read from scope.legendData.

  var link = function (scope, element, attrs) {
    scope.$watch(State.toString('layers.active'), function (n, o) {
      if (n === o) { return; }
      scope.legendData = LegendService.updateLegendData(
        State.spatial.bounds,
        scope.state.layers);
      console.log("legendData:", scope.legendData);
    });
    scope.$watch('state.spatial.bounds', function (n, o) {
      if (n === o) { return; }
      scope.legendData = LegendService.updateLegendData(n, scope.state.layers);
      console.log("legendData:", scope.legendData);
    });
  };

  return {
    link: link,
    restrict: 'E',
    // templateUrl: "../../legend/templates/legend.html",
    replace: true
  };
}]);