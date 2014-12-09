
angular.module('dashboard')
  //.directive('dashboard', ['NxtData', function (NxtData) {
  .directive('dashboard',
             ["EventAggregateService",
              function (EventAggregateService) {

  //  NxtData.getData(options);
  // draw full screen graph

  var link = function (scope, element, attrs) {

    var getData = function () {
      scope.mapState.getData({
        type: 'event',
        geom: scope.mapState.bounds,
        start: scope.timeState.start,
        end: scope.timeState.end,
        aggWindow: scope.timeState.aggWindow
      }).then(function (response) {
        scope.eventAggs = EventAggregateService
          .aggregate(response.data, scope.timeState.aggWindow);
      });
    };

    /**
     * Updates dashboard when user pans or zooms map.
     */
    scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      // get data for active event layergroups
      getData();
    });

    /**
     * Updates dashboard when layers are added or removed.
     */
    scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      // get data for active event layergroups
      getData();
    });

    /**
     * Updates dashboard when time zoom changes.
     */
    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      // get data for active event layergroups
      getData();
    });
  };

  return {
    link: link,
    templateUrl: 'dashboard/dashboard.html',
    replace: true,
    restrict: 'E'
  };

}]);
