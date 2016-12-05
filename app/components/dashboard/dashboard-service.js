'use strict';

angular.module('dashboard')
.service('DashboardService', ['EventAggregateService', 'State', 'TimeseriesService', 'DataService', function (EventAggregateService, State, TimeseriesService, DataService) {

  this.GRAPH_PADDING = 13; // Padding around the graph svg. Not to be confused
                          // with the padding inside the svg which is used for
                          // axis and labels.
  var ROW_BOTTOM_MARGIN = 20; // Pixels between graph rows.

  // TODO: so this probably is the culprit why you have to reset the graphs
  // in the favourites. Graphs persist here in the service, where
  // (when set in the scope) will be destroyed when building a new dashboard.
  // Still I wonder what happens when selecting a new favourite in the
  // dashboard. Will it also be destroyed there?

  // TODO: implement graphs in state!
  // Graphs are part of dashboard service for now. Graphs are constructed by
  // the order attribute of each selection in State.selections. It would be
  // better to remove the order attribute altogether and implement a
  // State.graphs object like: [[selectionID, selectionID, ...], [...], ...].
  // Where graphs is a list of graphs. For an example see:
  // https://github.com/nens/lizard-nxt/issues/1801#issuecomment-259432073
  this.graphs = [];
  var service = this;

  // TODO: this is bad since graphs shouldn't be reset.
  /**
   * Empties graphs object. When dashboard is rebuilt this is taken as a basis.
   */
  this.resetGraphs = function () {
    service.graphs = [];
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
   * @return {array} graph
   */
  this.buildGraphs = function () {
    var graphs = this._setAllContentToNotUpdated(service.graphs);

    // TODO: so this is bad too.
    var findSelectionData = function (selection) {
      var geomID = selection.asset || selection.geom || selection.timeseries;
      var dataUUID = selection.raster;
      var property = selection.timeseries !== undefined ?
          TimeseriesService.findProperty(selection) :
          DataService.findProperty(selection);
      if (property) {
        if (dataUUID && property.properties && property.properties[dataUUID]) {
          property = property.properties[dataUUID];
          if (property) {
            property.active = selection.active;
            if (property.data && selection.active) {
              var properties = typeContentFromProperty(property);
              properties.item.id = geomID + "$" + dataUUID;
              properties.item.color = selection.color;
              return properties;
            }
          }
        } else if (!dataUUID) {  // We're dealing with timeseries. In the future we might want
                  // to make timeseries / geometries and assets more consistent.
          if (property) {
            var type = property.valueType === 'image' ? 'image' :
                property.measureScale === 'ratio'? 'temporalBar': 'temporalLine';
            return { item: property, type: type };
          }
        }
      }
    };

    // TODO: because I am iterating over selection instead of the actual data.
    // Perhaps we would need to have a selection interface. That combines asset
    // geometry and timeseries data. All this data is of the same form.
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
          if (partOfContent && selectionType === graphs[selectionData.order].type) {
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
    DataService.assets.forEach(function (asset) {
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

    /**
   * Transforms property data into a format that is plottable in a graph.
   *
   * @return {Object} item: the transformed property; type: the graph type.
   */
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
  };

    /**
   * Adds DataService.[assets|geometries].properties to dashboard graphs object.
   *
   * @param {object} graphs     dashboard graph object.
   * @param {object} properties asset or geometries properties.
   * @return {array} graph
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
