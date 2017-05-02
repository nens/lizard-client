'use strict';

angular.module('dashboard')
.service('DashboardService', ['EventAggregateService', 'State', function (EventAggregateService, State) {

  this.GRAPH_PADDING = 13; // Padding around the graph svg. Not to be confused
                          // with the padding inside the svg which is used for
                          // axis and labels.
  var ROW_BOTTOM_MARGIN = 20; // Pixels between graph rows.

  // TODO: implement graphs in state!
  // Graphs stored in dashboard directive scope for now. Graphs are constructed
  // by the order attribute of each selection in State.selections. It would be
  // better to remove the order attribute altogether and implement a
  // State.graphs object like: [[selectionID, selectionID, ...], [...], ...].
  // Where graphs is a list of graphs. For an example see:
  // https://github.com/nens/lizard-nxt/issues/1801#issuecomment-259432073

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
  this.buildGraphs = function (graphs, timeseries, assets, geometries,
                               selections) {

    graphs = this._setAllContentToNotUpdated(graphs);

  /**
   * Checks if a selectable data item is in selections and returns it.
   *
   * @param  {array} selectiontype  timeseries, geom, asset, ... etc.
   * @param  {array} selectionId    Data source timeseries from timseriesService.
   * @param  {array} rasterId       Data source DataService.assets.
   * @return {function}             returns a function that returns a selection
   *                                based on a raster uuid or undefined () if
   *                                no raster is available for that selection
   *                                type.
   */
    var findSelection = function (selectiontype, selectionId) {
      return function (rasterId) {
        return _.find(selections, function(selection){
          return selection[selectiontype] === selectionId &&
            selection.raster === rasterId;
        });
      };};

    timeseries.forEach(function (ts) {
      var selection = (findSelection('timeseries', ts.id)());
      if (selection && selection.active) {
        ts.updated = true;
        ts.color = selection.color;
        ts.order = selection.order;
        if (graphs[selection.order]) {
          // Check if timeseries is already in the plot, if so replace data.

          var partOfContent =_.find(graphs[selection.order].content,
            function (c) { return c.id === ts.id; });
          if (partOfContent) {
            partOfContent.data = ts.data;
            partOfContent.color = selection.color;
            // Keep this graph
            partOfContent.updated = true;
          } else {
            graphs[selection.order].content.push(ts);
          }
        }
        else {
          var content = [ts];
          graphs[selection.order] = { 'content': content };
        }

      graphs[selection.order].type = ts.valueType === 'image' ? 'image' :
          ts.measureScale === 'ratio'? 'temporalBar': 'temporalLine';
      }
    });

    assets.forEach(function (asset) {

      var getSelected = findSelection('asset', asset.entity_name + "$" + asset.id);
      graphs = addPropertyData(graphs, asset.properties, getSelected);

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
      var getSelected = findSelection(
        'geom', geometry.geometry.coordinates.toString());
      graphs = addPropertyData(graphs, geometry.properties, getSelected);
    });

    // Add empty graphs for undefined items.
    _.forEach(graphs, function (graph, i) {
      if (graph === undefined) {
        graphs[i] = {'type': 'empty', content: [{updated: true}]};
      }
    });

    return this._filterActiveGraphs(graphs);
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
    }});
    return graphs;
  };

  var getGraphHeight = function (element, nGraphs) {
    return (element.height() - ROW_BOTTOM_MARGIN * nGraphs) / nGraphs;
  };

}]);
