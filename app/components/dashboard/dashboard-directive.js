
angular.module('dashboard')
  //.directive('dashboard', ['NxtData', function (NxtData) {
  .directive('dashboard',
             ["EventAggregateService",
              function (EventAggregateService) {

  //  NxtData.getData(options);
  // draw full screen graph

  var link = function (scope, element, attrs) {

    var getWidth = function () {
      return element.find('.dashboard-inner').width();
    };
    
    var getHeight = function () {
      return element.height();
    };

    scope.dimensions.width = getWidth();
    scope.dimensions.height = (getHeight() / 2) - 5;

    var aggregateEvents = function () {
      angular.forEach(scope.mapState.layerGroups, function (lg) {
        lg.getData({
          geom: scope.mapState.bounds,
          start: scope.timeState.start,
          end: scope.timeState.stop,
          type: 'Event'
        }).then(null, null, function (response) {

          if (response && response.data) {
            // aggregate response
            scope.eventAggs =
              EventAggregateService.aggregate(response.data,
                                              scope.timeState.aggWindow);
          }
        });
      });
    };

    /**
     * Updates dashboard when user pans or zooms map.
     */
    scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      aggregateEvents();
    });

    /**
     * Updates dashboard when layers are added or removed.
     */
    scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      aggregateEvents();
    });

    /**
     * Updates dashboard when time zoom changes.
     */
    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      aggregateEvents();
    });

    // init
    aggregateEvents();
  };

  return {
    link: link,
    templateUrl: 'dashboard/dashboard.html',
    replace: true,
    restrict: 'E'
  };

}]);
