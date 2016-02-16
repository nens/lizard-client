
angular.module('dashboard')
.directive('dashboard', [
  '$timeout',
  'State',
  'DataService',
  'TimeseriesService',
  'DashboardService',
  'DragService',
  function (
    $timeout,
    State,
    DataService,
    TimeseriesService,
    DashboardService,
    DragService
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

        if (scope.dashboard.graphs.length > 0) {
          // After ng-repeat has run, add the new graph areas as dropzones.
          $timeout(
            function () { DragService.addDropZones(element.children()); },
            0
          );
        }

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

      DragService.addDropZones([element[0]]);

    };

    return {
      link: link,
      templateUrl: 'dashboard/dashboard.html',
      replace: true,
      restrict: 'E'
    };

  }

]);
