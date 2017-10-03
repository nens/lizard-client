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
  'ChartCompositionService',
  function (
    State,
    DataService,
    TimeseriesService,
    DashboardService,
    DragService,
    ChartCompositionService
  ) {

    var link = function (scope, element, attrs) {

      scope.inspectDbGraphs = function (graphs) {
        console.log("[FFF] inspectDbGraphs; graphs =", graphs);
      }

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

        // console.log("[***] About to build dashboard; let's prep:");
        // console.log("[***] ChartCompositionService.composedCharts:", ChartCompositionService.composedCharts)

        var orderWanted,
            orderActual;

        State.selections.forEach(function (sel) {
          if (!sel.active) { return; }
          console.log("[***] Inspecting (active) selection:", sel);
          orderWanted = ChartCompositionService.getChartIndexForSelection(
            sel.uuid);
          orderActual = sel.order;

          if (orderWanted !== orderActual) {
            console.log("[***] KICK THE BABY -- discrepancy in orderWanted vs. orderActual:");
            console.log("[***] orderWanted (via CCService).......:", orderWanted);
            console.log("[***] orderActual (=selection.order)....:", orderActual);
            sel.order = orderWanted;
          }
        });

        scope.dashboard.graphs = DashboardService.buildGraphs(
          scope.dashboard.graphs,
          TimeseriesService.timeseries,
          DataService.assets,
          DataService.geometries,
          State.selections
        );

        _.forEach(scope.dashboard.graphs, function (graph) {

          // console.log("[***] Inspecting graph:", graph);

          graph.dimensions = DashboardService.getDimensions(
            element,
            scope.dashboard.graphs.length,
            graph.type === 'distance' || graph.type === 'crosssection' // give space for axis.
          );
        });
      };

      DataService.onSelectionsChange = buildDashboard;
      DataService.onAssetsChange = buildDashboard;
      DataService.onGeometriesChange = buildDashboard;
      TimeseriesService.onTimeseriesChange = function () { console.log("TimeseriesService.onTimeseriesChange called.."); buildDashboard() };

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
