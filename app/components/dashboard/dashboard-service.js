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
  this.buildGraphs = function (graphs, timeseries, assets, geometries) {

    timeseries.forEach(function (ts) {
      if (graphs[ts.order]) {
        graphs.type = 'temporalLine';
        var partOfContent =_.find(graphs[ts.order].content, function (c) {
          return c.id === ts.id;
        });
        if (partOfContent) {
          partOfContent.data = ts.data;
        } else {
          graphs[ts.order].content.push(ts);
        }
      }
      else {
        var content = [ts];
        graphs[ts.order] = { 'type': 'temporalLine', 'content': content };
      }
      var indexOflast = graphs[ts.order].content.length -1;
      graphs[ts.order].content[indexOflast].updated = true;
    });

    assets.forEach(function (asset) {
      graphs = addPropertyData(graphs, asset.properties);

      // Specific logic to add crosssections. We could abstract this to all
      // assets with children that have timeseries.
      if (asset.entity_name === 'leveecrosssection'
        && asset.crosssection && asset.crosssection.active) {
        graphs[asset.crosssection.order] = {
          'type': 'crosssection',
          'content': [asset]
        };
        graphs[asset.crosssection.order].content[0].updated = true;
      }

    });

    geometries.forEach(function (geometry) {
      graphs = addPropertyData(graphs, geometry.properties);
    });

    // Add empty graphs for undefined items.
    _.forEach(graphs, function (graph, i) {
      if (graph === undefined) {
        graphs[i] = {'type': 'empty', content: [{updated: true}]};
      }
    });

    _.forEach(graphs, function (g, i) {
      g.content = _.filter(g.content, function (c) { return c.updated === true; });
      _.forEach(g.content, function (c) { c.updated = false; });
      if (!g.content.length) {
        graphs.splice(i, 1);
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
        var indexOflast = graphs[property.order].content.length - 1;
        graphs[property.order].content[indexOflast].updated = true;
      }
    });
    return graphs;
  };

  var getGraphHeight = function (element, nGraphs) {
    return (element.height() - ROW_BOTTOM_MARGIN * nGraphs) / nGraphs;
  };


}]);
