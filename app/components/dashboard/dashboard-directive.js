
angular.module('dashboard')
.directive('dashboard', [
  'State',
  'DataService',
  'TimeseriesService',
  'DashboardService',
  function (
    State,
    DataService,
    TimeseriesService,
    DashboardService
  ) {

    var link = function (scope, element, attrs) {

      scope.dashboard = {
        state: State
      };

      var buildDashboard = function () {

        TimeseriesService.minPoints =
          element.width() - DashboardService.GRAPH_PADDING;

        scope.dashboard.graphs = DashboardService.buildGraphs(
          TimeseriesService.timeseries,
          DataService.assets,
          DataService.geometries
        );

        _.forEach(scope.dashboard.graphs, function (graph) {
          graph.dimensions = DashboardService.getDimensions(
            element,
            scope.dashboard.graphs.length,
            graph.type === 'distance' // give space for axis.
          );
        });

      };

      DataService.onAssetsChange = buildDashboard;
      DataService.onGeometriesChange = buildDashboard;
      TimeseriesService.onTimeseriesChange = buildDashboard;

      /**
       * Update dashboard when timeline has moved.
       */
      scope.$watch(State.toString('temporal.timelineMoving'), function (off) {
        if (!State.temporal.timelineMoving) {
          TimeseriesService.syncTime();
        }
      });

      var applyResize = function () {
        scope.$apply(buildDashboard);
      };

      window.addEventListener('resize', applyResize);

      scope.$on('$destroy', function () {
        window.removeEventListener('resize', applyResize);
        DataService.onAssetsChange = null;
        DataService.onGeometriesChange = null;
        TimeseriesService.onTimeseriesChange = null;
      });

    };

    return {
      link: link,
      templateUrl: 'dashboard/dashboard.html',
      replace: true,
      restrict: 'E'
    };

  }

]);
