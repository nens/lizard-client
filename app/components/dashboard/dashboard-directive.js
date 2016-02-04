
angular.module('dashboard')
  .directive('dashboard',
             [
              'State',
              'DataService',
              'TimeseriesService',
              function (
                State,
                DataService,
                TimeseriesService) {

  var link = function (scope, element, attrs) {

    var GRAPH_PADDING = 13;
    var ROW_BOTTOM_MARGIN = 10;

    var colors = [
      '#16a085',
      '#3498db',
      '#c0392b',
      '#2980b9',
      '#1abc9c',
      '#7f8c8d',
      '#e74c3c',
    ];

    scope.dashboard = {
      state: State
    };

    var buildGraphs = function (timeseries, assets, geometries) {

      // Graphs are an array of graph-directive objects representing timeseries
      // and raster data.
      // {
      //   'type': 'type',
      //   content: [{
      //     data: [],
      //     keys: {},
      //     labels: {},
      //     color: ''
      //   }]
      // }
      var graphs = [];

      var addPropertyData = function (properties) {
        _.forEach(properties, function (property, slug) {
          if (property.data.length > 1) {
            var item = {
              data: property.data,
              keys: {x: 0, y: {y0: 1, y1: 1}},
              labels: {x: 'm', y: property.unit }
            };
            graphs.push({ type: 'distance', content: [item] });
          }
        });
      };

      if (timeseries.length) {
        var content = [];
        timeseries.forEach(function (ts) {
          ts.color = colors[0];
          content.push(ts);
        });
        graphs.push({ 'type': 'temporalLine', 'content': content });
      }

      assets.forEach(function (asset) {
        addPropertyData(asset.properties);
      });

      geometries.forEach(function (geometry) {
        addPropertyData(geometry.properties);
      });

      console.log('Dashboard:', graphs);

      return graphs;
    };

    var buildDashboard = function () {

      TimeseriesService.minPoints = element.width() - GRAPH_PADDING;

      scope.dashboard.graphs = buildGraphs(
        TimeseriesService.timeseries,
        DataService.assets,
        DataService.geometries
      );

      _.forEach(scope.dashboard.graphs, function (graph) {
        graph.dimensions = getDimensions(
          element,
          scope.dashboard.graphs.length,
          graph.type === 'distance'
        );
      });

    };

    var getGraphHeight = function (element, nGraphs) {
      return (element.height() - ROW_BOTTOM_MARGIN * nGraphs) / nGraphs;
    };

    var getDimensions = function (element, nGraphs, showXAxis) {

      return {
        width: element.width() - GRAPH_PADDING,
        height: getGraphHeight(element, nGraphs),
        padding: {
          top: 10,
          right: 10,
          bottom: showXAxis ? 40 : 15,
          left: 10
        }
      };

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

}]);
