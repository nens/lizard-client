/**
 * Controls dashboard drawing area. The dashboard context consists of two parts
 * the omnibox in db-mode and this dashboard component.
 */
angular.module('dashboard')
.directive('dashboard', [
  '$timeout',
  'ChartCompositionService',
  'DashboardChartService',
  'DataService',
  'DragService',
  'State',
  'TimeseriesService',
  function (
    $timeout,
    ChartCompositionService,
    DashboardChartService,
    DataService,
    DragService,
    State,
    TimeseriesService
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

      var GRAPH_PADDING = 13; // Padding around the graph svg. Not to be confused
      // with the padding inside the svg which is used for
      // axis and labels.
      var ROW_BOTTOM_MARGIN = 20; // Pixels between graph rows.
      /**
       * Creates a dimensions object for graph-directive.
       *
       * @param  {angular element} element   element to draw graphs in.
       * @param  {int}            nGraphs   number of graphs in dashboard.
       * @param  {boolean}         showXAxis should be true for non temporal graphs.
       * @return {object}          dimension object per graph.
       */
      var getDimensions = function (element, nGraphs, showXAxis) {
        var AXIS_LABEL_SPACE = 60;
        var AXIS_DEFAULT_SPACE = 15;
        var PAD = 10;
        var PAD_RIGHT = 40;
        return {
          width: element.width() - GRAPH_PADDING,
          height: getGraphHeight(element, nGraphs),
          padding: {
            top: PAD,
            right: PAD_RIGHT,
            bottom: showXAxis ? AXIS_LABEL_SPACE : AXIS_DEFAULT_SPACE,
            left: AXIS_LABEL_SPACE
          }
        };
      };

      var getGraphHeight = function (element, nGraphs) {
        return (element.height() - ROW_BOTTOM_MARGIN * nGraphs) / nGraphs;
      };

      /**
       * Combines timeseries, with other chartable active data to dashboard data.
       *
       * Graphs are an array of graph-directive objects representing timeseries
       * and raster data.
       * {
       *   'type': 'type',
       *   content: [{
       *     data: [],
       *     keys: {},
       *     labels: {},
       *     color: ''
       *   }]
       * }
       *
       * NOTE: this is a temporary solution. We should do something different with a
       * list of graphs on the state. A synchronous build of the dashboard into
       * items which fill themselves with asynchronous data.
       *
       * @param  {array} graphs     Currently plotted graphs.
       * @param  {array} timeseries Data source timeseries from timseriesService.
       * @param  {array} assets     Data source DataService.assets.
       * @param  {array} geometries Data source DataService.geometries.
       * @return {array} graph
       */
      var buildGraphs = function () {
        if (State.temporal.timelineMoving) return;

        // This is here to remove inactive charts from the ChartComposition.
        // 'fetching' is set in rasterlayer-directive when fetching raster data async.
        DashboardChartService.updateDashboardCharts(
          State.layers.filter(function (layer) { return layer.type === 'raster'; }),
          DataService.assets,
          DataService.geometries,
          []);

        var graphs = _setAllContentToNotUpdated(scope.dashboard.graphs);

        var getChartData = function(chart) {
          var result;
          if (chart.type === 'timeseries') {
            var ts = _.find(TimeseriesService.timeseries, function (ts) {
              return ts.id.indexOf(chart.timeseries) !== -1;
            });
            if (!ts) return null;
            return {
              data: ts.data,
              keys: {x: 'timestamp', y: chart.measureScale === 'ratio' ? 'sum' : 'value'}
            };
          } else {
            var assetOrGeom;

            if (chart.asset) {
              assetOrGeom = DataService.getAssetByKey(chart.asset);
            } else {
              assetOrGeom = _.find(DataService.geometries, function (geom) {
                geom = geom.geometry;
                return (chart.geometry.type === geom.type &&
                        chart.geometry.coordinates[0] == geom.coordinates[0] &&
                        chart.geometry.coordinates[1] == geom.coordinates[1]);
              });
            }

            // Sometimes when restoring favourites the data isn't present yet,
            // just ignored it then. It'll get updated next time buildGraphs is called.
            if (!assetOrGeom || !assetOrGeom.properties ||
                !assetOrGeom.properties[chart.raster] ||
                !assetOrGeom.properties[chart.raster].data) {
              return null;
            }

            return {
              data: assetOrGeom.properties[chart.raster].data,
              keys: {x: 0, y: 1}
            };
          }
        };

        var getThresholds = function(chart) {
          if (chart.type !== 'timeseries') return null;

          var ts = _.find(TimeseriesService.timeseries, function (ts) {
            return ts.id.indexOf(chart.timeseries) !== -1;
          });
          if (!ts) return null;

          if (chart.asset) {
            var surfaceLevel = DataService.getPropFromAssetOrParent(
              DataService.getAssetByKey(chart.asset), 'surface_level');


            return ts.thresholds.map(function (threshold) {
              threshold.surface_level = surfaceLevel;
              return threshold;
            });
          }
        }

        var Endlösung = [];
        ChartCompositionService.composedCharts.forEach(function (value, index) {
          var graph = {
            type: null,
            content: [],
            dimensions: null
          };

          value.forEach(function (chartKey) {
            var chart = DashboardChartService.getOrCreateChart(chartKey);
            var chartData = getChartData(chart);
            if (!chartData) {
              console.log('buildGraphs: no data for chart', chartKey);
              return;
            }

            graph.type = graph.type || chart.graphType;

            graph.content.push({
              updated: true,
              color: chart.color,
              data: chartData.data,
              keys: chartData.keys,
              unit: chart.unit,
              xLabel: chart.description,
              description: chart.description,
              id: chartKey,
              reference_frame: chart.reference_frame,
              thresholds: getThresholds(chart)
            });
          });

          if (graph.content.length) {
            Endlösung.push(graph);
          }
        });

        console.log('buildGraphs: Endlösung', JSON.parse(JSON.stringify(Endlösung)));
        return Endlösung;
      };


      /**
       * Updates dashboard graphs on the scope when called.
       */
      var buildDashboard = function () {
        TimeseriesService.minPoints = element.width() - GRAPH_PADDING;

        scope.dashboard.graphs = buildGraphs();

        _.forEach(scope.dashboard.graphs, function (graph) {
          graph.dimensions = getDimensions(
            element,
            scope.dashboard.graphs.length,
            graph.type === 'distance' || graph.type === 'crosssection' // give space for axis.
          );
        });
      };

      DataService.buildDashboard = buildDashboard;
      buildDashboard();

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
        DataService.buildDashboard = function () {};
      });

      // Make dashboard a dropable element.
      DragService.addDropZone(element);

    };

    /**
     * Go over all graphs and graphs.content to set updated to false;
     * @param {array}  graphs
     * @return {array} graphs
     */
    var _setAllContentToNotUpdated = function (graphs) {
      _.forEach(graphs, function (g, i) {
        _.forEach(g.content, function (c) {
          c.updated = false;
        });
      });
      return graphs;
    };

    return {
      link: link,
      templateUrl: 'dashboard/dashboard.html',
      replace: true,
      restrict: 'E'
    };

  }

  /* Replace this at some point */
  /* this._getContentForEventSelection = function (selection) {
   *   return {
   *     data: selection.data.map(function (event) {
   *       return {
   *         x: event.properties.timestamp_start,
   *         y: parseFloat(event.properties.value)
   *       };
   *     }),
   *     keys: {x: 'x', y: 'y'},
   *     unit: '',
   *     color: selection.color,
   *     xLabel: '',
   *     id: selection.url,
   *     updated: true
   *   };
   * };*/

]);
