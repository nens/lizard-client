'use strict';

angular.module('dashboard')
.service('DashboardService', ['EventAggregateService', 'State', function (EventAggregateService, State) {

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
   * @param  {array} graphs     Currently plotted graphs.
   * @param  {array} timeseries Data source timeseries from timseriesService.
   * @param  {array} assets     Data source DataService.assets.
   * @param  {array} geometries Data source DataService.geometries.
   * @return {array} graph
   */
  this.buildGraphs = function (graphs, timeseries, assets, geometries) {

    timeseries.forEach(function (ts) {
      ts.updated = true;
      if (graphs[ts.order]) {
        // Check if timeseries is already in the plot, if so replace data.
        var partOfContent =_.find(graphs[ts.order].content, function (c) {
          return c.id === ts.id;
        });
        if (partOfContent) {
          partOfContent.data = ts.data;
          partOfContent.color = ts.color;
          // Keep this graph
          partOfContent.updated = true;
        } else {
          graphs[ts.order].content.push(ts);
        }
      }
      else {
        var content = [ts];
        graphs[ts.order] = { 'content': content };
      }

      graphs[ts.order].type = ts.valueType === 'image' ? 'image' : 'temporalLine';

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

    // Remove all graphs that have not been updated or are empty.
    _.forEach(graphs, function (g, i) {
      g.content = _.filter(g.content, function (c) { return c.updated; });
      _.forEach(g.content, function (c) { c.updated = false; });
      if (g.content.length === 0) {
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
    var PAD_RIGHT = 40;
    return {
      width: element.width() - this.GRAPH_PADDING,
      height: getGraphHeight(element, nGraphs),
      padding: {
        top: PAD,
        right: PAD_RIGHT,
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
        var type = '';
        var item = {};
        if (property.format !== 'Vector') {
          item = {
            data: property.data,
            keys: {x: 0, y: 1},
            unit: property.unit,
            // TODO: xLabel is not always meters.
            xLabel: 'm'
          };

          type = slug === 'rain' ? 'rain' : 'distance';
        }
        else if (property.format === 'Vector') {
          item = {
            data: EventAggregateService.aggregate(
              property.data,
              State.temporal.aggWindow,
              property.color
            ),
            keys: {
              x: 'timestamp',
              y: 'count',
              color: 'color',
              category: 'category'
            },
            unit: property.unit,
          };

          type = 'event';
        }
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
