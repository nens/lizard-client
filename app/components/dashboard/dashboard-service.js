'use strict';

angular.module('dashboard')
.service('DashboardService', [
         'EventAggregateService','State', 'DashboardChartService', 'ChartCompositionService',
function (EventAggregateService,  State,  DashboardChartService, ChartCompositionService) {

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
   * NOTE: this is a temporary solution. We should do something different with a
   * list of graphs on the state. A synchronous build of the dashboard into
   * items which fill themselves with asynchronous data.
   *
   * @param  {array} graphs     Currently plotted graphs.
   * @param  {array} timeseries Data source timeseries from timseriesService.
   * @param  {array} assets     Data source DataService.assets.
   * @param  {array} geometries Data source DataService.geometries.
   * @param  {array} selections State.selections.
   * @return {array} graph
   */
  this.buildGraphs = function (graphs, timeseries, assets, getAssetByKey, geometries)
  {
    // XXX This is only here now to remove inactive charts from the ChartComposition.
    // It can be simpler.
    DashboardChartService.updateDashboardCharts(
      State.layers.filter(function (layer) {
        return layer.active && layer.type === 'raster';
      }),
      assets,
      geometries,
      []);

    graphs = this._setAllContentToNotUpdated(graphs);

    var getChartData = function(chart) {
      var result;
      if (chart.type === 'timeseries') {
        var ts = _.find(timeseries, function (ts) {
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
          assetOrGeom = getAssetByKey(chart.asset);
        } else {
          assetOrGeom = _.find(geometries, function (geom) {
            geom = geom.geometry;
            return (chart.geometry.type === geom.type &&
                    chart.geometry.coordinates[0] == geom.coordinates[0] &&
                    chart.geometry.coordinates[1] == geom.coordinates[1]);
          });
        }
        console.log('assetOrGeom', assetOrGeom, chart);
        return {
          data: assetOrGeom.properties[chart.raster].data,
          keys: {x: 0, y: 1}
        };
      }
    };

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
        if (!chartData) return;

        graph.type = graph.type || (
          chart.measureScale === 'ratio' ? 'temporalBar' : 'temporalLine');

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
          thresholds: [],
        });
      });

      if (graph.content.length) {
        Endlösung.push(graph);
      }
    });

    return Endlösung;
  };

  this._getContentForEventSelection = function (selection) {
    return {
      data: selection.data.map(function (event) {
        return {
          x: event.properties.timestamp_start,
          y: parseFloat(event.properties.value)
        };
      }),
      keys: {x: 'x', y: 'y'},
      unit: '',
      color: selection.color,
      xLabel: '',
      id: selection.url,
      updated: true
    };
  };

  /**
   * Remove all graphs that have not been updated or are empty.
   * @param  {array}  graphs
   * @return {array}  filtered graphs.
   */
  this._filterActiveGraphs = function (graphs) {
    var notEmptyUpdated = [];
    _.forEach(graphs, function (g, i) {
      g.content = _.filter(g.content, function (c) { return c.updated; });
      if (g.content.length > 0) {
        notEmptyUpdated.push(g);
      }
    });
    return notEmptyUpdated;
  };

  /**
   * Go over all graphs and graphs.content to set updated to false;
   * @param {array}  graphs
   * @return {array} graphs
   */
  this._setAllContentToNotUpdated = function (graphs) {
    _.forEach(graphs, function (g, i) {
      _.forEach(g.content, function (c) {
        c.updated = false;
      });
    });
    return graphs;
  };

  /**
   * Creates a dimensions object for graph-directive.
   *
   * @param  {angular element} element   element to draw graphs in.
   * @param  {int}            nGraphs   number of graphs in dashboard.
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
   * Transforms property data into a format that is plottable in a graph.
   *
   * @return {Object} item: the transformed property; type: the graph type.
   */
  var typeContentFromProperty = function (property) {
    var slug = property.slug;
    var type = '';
    var item = {};
    if (property.format !== 'Vector') {
      item = {
        color: property.color,
        data: property.data,
        keys: {x: 0, y: 1},
        unit: property.unit,
        // TODO: xLabel is not always meters.
        xLabel: 'm',
        updated: true
      };

      if (slug === 'rain') {
        type = 'rain';
      } else if (property.temporal) {
        if (property.measureScale === 'ratio'){
          type = 'temporalBar';
        } else {
          type = 'temporalLine';
        }
      } else {
        type = 'distance';
      }
    } else if (property.format === 'Vector') {
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
        updated: true
      };

      type = 'event';
    }
    return {type: type, content: [item]};
  };

  /**
   * Adds DataService.[assets|geometries].properties to dashboard graphs object.
   *
   * @param {array} graphs         Currently plotted graphs.
   * @param {object} properties     asset or geometries properties.
   * @param {function} getSelected function that returns the selection
   *                                are also selected.
   */
  var addPropertyData = function (graphs, properties, getSelected) {
    _.forEach(properties, function (property, rasterID) {
      var selection = getSelected(rasterID);
      if(selection && selection.active){
        property.color = selection.color;
        var graph = graphs[selection.order];
        var typeContent = typeContentFromProperty(property);
        if (graph && typeContent.type === graph.type) {
          graph.content.push(typeContent.content[0]);
        } else {
          graphs[selection.order] = typeContent;
        }
        var indexOflast = graphs[selection.order].content.length - 1;
        graphs[selection.order].content[indexOflast].updated = true;
        graphs[selection.order].content[indexOflast].selectionUuid = selection.uuid;
    }});
    return graphs;
  };

  var getGraphHeight = function (element, nGraphs) {
    return (element.height() - ROW_BOTTOM_MARGIN * nGraphs) / nGraphs;
  };

}]);
