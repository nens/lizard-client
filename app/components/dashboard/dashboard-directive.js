
angular.module('dashboard')
  //.directive('dashboard', ['NxtData', function (NxtData) {
  .directive('dashboard',
             ["EventAggregateService",
              function (EventAggregateService) {

  //  NxtData.getData(options);
  // draw full screen graph

  var link = function (scope, element, attrs) {

    console.log(scope.eventAggs);
    /**
     * Updates dashboard when user pans or zooms map.
     */
    scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      // get data for active event layergroups
      scope.eventAggs =
        EventAggregateService.aggregate(scope.tmp, scope.timeState.aggWindow);
    });

    /**
     * Updates dashboard when layers are added or removed.
     */
    scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      // get data for active event layergroups
      scope.eventAggs =
        EventAggregateService.aggregate(scope.tmp, scope.timeState.aggWindow);
    });

    /**
     * Updates dashboard when time zoom changes.
     */
    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      // get data for active event layergroups
      scope.eventAggs =
        EventAggregateService.aggregate(scope.tmp, scope.timeState.aggWindow);
      console.log(scope.eventAggs);
    });
  };

  return {
    link: link,
    templateUrl: 'dashboard/dashboard.html',
    replace: true,
    restrict: 'E'
  };

}]);
