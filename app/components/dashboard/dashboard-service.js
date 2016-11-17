'use strict';

angular.module('dashboard')
.service('DashboardService', ['EventAggregateService', 'State', 'TimeseriesService', function (EventAggregateService, State, TimeseriesService) {

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

    graphs = this._setAllContentToNotUpdated(graphs);

    var findSelectionData = function (selection) {
      var geomID = selection.asset || selection.geom || selection.timeseries;
      var dataUUID = selection.raster;
      var property = TimeseriesService.findProperty(selection);
      if (property) {
        if (dataUUID) {
          property = property.properties[dataUUID];
          property.active = selection.active;
          if (property && property.data && property.active) {
            var properties = typeContentFromProperty(property);
            properties.item.id = geomID + "$" + dataUUID;
            properties.item.color = selection.color;
            return properties;
          }
        } else {  // We're dealing with timeseries. In the future we might want
                  // to make timeseries / geometries and assets more consistent.
          if (property) {
            var type = property.valueType === 'image' ? 'image' :
                property.measureScale === 'ratio'? 'temporalBar': 'temporalLine';
            return { item: property, type: type };
          }
        }
      }
    };

    State.selections.forEach(function (selection) {
      var selectionData = findSelectionData(selection);
      if (selectionData && selectionData.item.data){
        var selectionType = selectionData.type;
        selectionData = selectionData.item;
        selectionData.updated = true;
        if (graphs[selectionData.order]) {
          // Check if selection is already in the plot, if so replace data.
          var partOfContent =_.find(graphs[selectionData.order].content, function (c) {
            return c.id === selectionData.id;
          });
          if (partOfContent && selectionType === partOfContent.type) {
            partOfContent.data = selectionData.data;
            partOfContent.color = selectionData.color;
            // Keep this graph
            partOfContent.updated = true;
          } else {
            graphs[selection.order].content.push(selectionData);
            graphs[selection.order].type = selectionType;
          }
        } else {
          var content = [selectionData];
          graphs[selection.order] = { content: content, type: selectionType };
        }
      }
    });

    // TODO: Crosssections are not yet implemented as selection.
    assets.forEach(function (asset) {
      // Specific logic to add crosssections. We could abstract this to all
      // assets with children that have timeseries.
      if (asset.entity_name === 'leveecrosssection'
        && asset.crosssection && asset.crosssection.active) {
        graphs = addPropertyData(graphs, asset.properties);
        graphs[asset.crosssection.order] = {
          'type': 'crosssection',
          'content': [asset]
        };
        graphs[asset.crosssection.order].content[0].updated = true;
      }

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
      _.forEach(g.content, function (c) { c.updated = false; });
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

  // TODO: docstrings
  var typeContentFromProperty = function (property) {
    var slug = property.slug;
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
        return {type: type, item: item}
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
          unit: property.unit
        };

        type = 'event';
      }
      return {type: type, item: item}
    }
    // return {type: '', item: {}}
  };

    /**
   * Adds DataService.assets|geometries.properties to dashboard graphs object.
   *
   * @param {object} graphs     dashboard graph object.
   * @param {object} properties asset or geometries properties.
   */
  var addPropertyData = function (graphs, properties) {
    _.forEach(properties, function (property) {
      var convertedProperty = typeContentFromProperty(property);
      var type = convertedProperty.type;
      var item = convertedProperty.item;
      graphs[property.order] = { type: type, content: [item] };
      var indexOflast = graphs[property.order].content.length - 1;
      graphs[property.order].content[indexOflast].updated = true;
    });
    return graphs;
  };

  var getGraphHeight = function (element, nGraphs) {
    return (element.height() - ROW_BOTTOM_MARGIN * nGraphs) / nGraphs;
  };


}]);
