angular.module('legend')
.directive('legend', ["LegendService", "State", function(LegendService, State) {

  var link = function (scope, element, attrs) {

    /* 2x $watch used for triggering changes in both the discrete and
       continuous legends: */

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
    templateUrl: "legend/templates/legend.html",
    replace: true
  };

}]);