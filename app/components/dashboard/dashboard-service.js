'use strict';

angular.module('dashboard')
.service('DashboardService', [ function () {

  this.GRAPH_PADDING = 13; // Padding around the graph svg. Not to be confused
                          // with the padding inside the svg which is used for
                          // axis and labels.
  var ROW_BOTTOM_MARGIN = 20; // Pixels between graph rows.


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
   * @param  {array} timeseries Data source timeseries from timseriesService.
   * @param  {array} assets     Data source DataService.assets.
   * @param  {array} geometries Data source DataService.geometries.
   * @return {array} graph
   */
  this.buildGraphs = function (timeseries, assets, geometries) {

    var graphs = [];

    timeseries.forEach(function (ts) {
      if (graphs[ts.order]) {
        graphs.type = 'temporalLine';
        graphs[ts.order].content.push(ts);
      }
      else {
        var content = [ts];
        graphs[ts.order] = { 'type': 'temporalLine', 'content': content };
      }
    });

    assets.forEach(function (asset) {
      graphs = addPropertyData(graphs, asset.properties);
    });

    geometries.forEach(function (geometry) {
      graphs = addPropertyData(graphs, geometry.properties);
    });

    // Add empty graphs for undefined items.
    _.forEach(graphs, function (graph, i) {
      if (graph === undefined) {
        graphs[i] = {'type': 'empty'};
      }
    });

    return graphs;
  };

  /**
   * Creates a dimensions object for graph-directive.
   *
   * @param  {angular element} element   element to draw graphs in.
   * @param  {[int}            nGraphs   number of graphs in dashboard.
   * @param  {boolean}         showXAxis should be true for non temporal graphs.
   * @return {object}          dimension object per graph.
   */
  this.getDimensions = function (element, nGraphs, showXAxis) {
    var AXIS_LABEL_SPACE = 60;
    var AXIS_DEFAULT_SPACE = 15;
    var PAD = 10;
    return {
      width: element.width() - this.GRAPH_PADDING,
      height: getGraphHeight(element, nGraphs),
      padding: {
        top: PAD,
        right: PAD,
        bottom: showXAxis ? AXIS_LABEL_SPACE : AXIS_DEFAULT_SPACE,
        left: AXIS_LABEL_SPACE
      }
    };
  };

  /**
   * Adds DataService.assets|geometries.properties to dashboard graphs object.
   *
   * @param {object} graphs     dashboard graph object.
   * @param {object} properties asset or geometries properties.
   */
  var addPropertyData = function (graphs, properties) {
    _.forEach(properties, function (property, slug) {
      if (property.active) {
        var item = {
          data: property.data,
          keys: {x: 0, y: 1},
          labels: {x: 'm', y: property.unit }
        };

        var type = slug === 'rain' ? 'rain' : 'distance';
        graphs[property.order] = { type: type, content: [item] };
      }
    });
    return graphs;
  };

  var getGraphHeight = function (element, nGraphs) {
    return (element.height() - ROW_BOTTOM_MARGIN * nGraphs) / nGraphs;
  };


}]);
