/**
 * Controls dashboard drawing area. The dashboard context consists of two parts
 * the omnibox in db-mode and this dashboard component.
 */
angular.module('dashboard')
.directive('dashboard', [
  'State',
  'DataService',
  'TimeseriesService',
  'DashboardService',
  'DragService',
  '$timeout',
  function (
    State,
    DataService,
    TimeseriesService,
    DashboardService,
    DragService,
    $timeout
  ) {

    var link = function (scope, element, attrs) {

      /**
       * Connect State to scope and store an array representation of timeseries,
       * raster and assets.
       *
       * Timeseries have an order property which should correspond to the index
       * in scope.dashboard.graphs.
       *
       * @type {Object}
       */
      scope.dashboard = {
        graphs: [],
        state: State
      };

      /**
       * Updates dashboard graphs on the scope when called.
       */
      var buildDashboard = function () {

        TimeseriesService.minPoints =
          element.width() - DashboardService.GRAPH_PADDING;

        scope.dashboard.graphs = DashboardService.buildGraphs(
          scope.dashboard.graphs,
          TimeseriesService.timeseries,
          DataService.assets,
          DataService.getAssetByKey,
          DataService.geometries);

        _.forEach(scope.dashboard.graphs, function (graph) {
          graph.dimensions = DashboardService.getDimensions(
            element,
            scope.dashboard.graphs.length,
            graph.type === 'distance' || graph.type === 'crosssection' // give space for axis.
          );
        });
      };

      DataService.onChartsChange = buildDashboard;
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

      // Make dashboard a dropable element.
      DragService.addDropZone(element);

    };

    return {
      link: link,
      templateUrl: 'dashboard/dashboard.html',
      replace: true,
      restrict: 'E'
    };

  }

]);
