/**
 * @name Graph
 * @class Graph
 * @memberOf app
 *
 * @summary Service to create and update a graph
 *
 * @description Inject "Graph" and call new graph(<args>) to create a
 * graph. Currently the graph supports lines, bars, and a flat
 * donut called horizontal stacked bar. The user may interact with
 * the graph through click and hover functions. Graph inherits from
 * NxtD3, a lower level d3 helper class.
 *
 * NOTE: The donut code is currently not used anywhere in lizard-client.
 *
 * Everything in the graphs is animated according to NxtD3.transTime.
 */
angular.module('lizard-nxt')
  .factory("Graph", [
    "$timeout", "NxtD3", "ChartContainer", "UtilService", "State", "$filter",
    "RelativeToSurfaceLevelService",
  function ($timeout, NxtD3, ChartContainer, UtilService, State, $filter, RTSLService) {

  var MIN_WIDTH_INTERACTIVE_GRAPHS = 400; // Only graphs bigger get mouseover
                                          // and click interaction.

  /**
   * @constructor
   *
   * @memberOf Graph
   * @param {object} element    svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {object} xDomain - override the domain for the graphs.
   */
  function Graph(element, dimensions, xDomain) {
    NxtD3.call(this, element, dimensions, xDomain);
    this._svg = this._createDrawingArea();
    this._containers = [];
  }

  Graph.prototype = Object.create(NxtD3.prototype, {
    constructor: Graph
  });

  Graph.prototype.resize = function (newDim) {
    NxtD3.prototype.resize.call(this, newDim);
    this._svg = this._createDrawingArea();
    this._svg.selectAll('.axis').remove();

    // reposition labels
    drawLabel(this._svg, this.dimensions, undefined, true);
    drawLabel(this._svg, this.dimensions, undefined, false);
  };

  /**
   * @function
   * @memberOf Graph
   * @param {object} content - Array of object with data, keys, unit, color,
   *                           xlabel and if multi line: id.
   *        data   Currently supports the format:
   *                        [
   *                          collection,
   *                          ...,
   *                        ]
   *        keys   Mapping between x and y values of data object:
   *                        example: {x: 0, y: 1}
   *        unit   string   will be
   *                        mapped to y axis and the label of the y axis.
   *        color  string   Color.
   *        xLabel stirng   Label for x axis.
   *        id     string or inter identiefier for charts in the graph.
   *
   * @param {boolean} temporal to draw an time axis or not.
   * @param {boolean} transitioning to draw a subset of data now, and the full
   *                                set after a timeout if drawline is not
   *                                called again before the timeout finishes.
   *                                Use transitioning = true when callig this
   *                                function many times as a result of a user
   *                                induced action.
   * @description           Draws multiple line, if necessary sets up the graph,
   *                        if necessary modifies domain and redraws axis,
   *                        and draws the line according to the data object.
   *                        Currently only a linear scale on the x-axis is
   *                        supported.
   */
  Graph.prototype.drawLine = function (content, temporal, transitioning) {
    var graph = this;
    graph._yPerUnit = {}; // one line graph has a y -scale and axis per unit in
                          // content.

    // Get x scale and axis for temporal domain.
    var range = graph._makeRange('x', graph.dimensions);
    var width = graph._getWidth(graph.dimensions);
    var scale;
    if (temporal) {
      scale = graph._makeScale(
        {max: graph._xDomain.end, min: graph._xDomain.start},
        range,
        {scale: 'time'}
      );
    } else {
      // If not temporal content has lenght 1 and is linear.
      var xMinMax = this._maxMin(content[0].data, content[0].keys.x);
      scale = graph._makeScale(
        xMinMax,
        range,
        {scale: 'linear'}
      );
      drawLabel(graph._svg, graph.dimensions, content[0].xLabel, false);
    }
    var axis = graph._makeAxis(scale, {orientation: 'bottom'}, graph.dimensions);
    graph._xy = {
      x: {
        scale: scale,
        axis: axis
      }
    };

    // Draw x axis
    this._drawAxes(
      this._svg,
      graph._xy.x.axis,
      this.dimensions,
      false, // is not a y axis.
      0 // no transition of x axis
    );

    // Filter out old charts.
    graph._containers = graph._containers.filter(function (chart) {
      var present = _.some(content, function (item) {
        return chart.id === item.id;
      });
      if (!present && chart.path) {
        chart.path.remove(); // Remove path from graph.
      }
      return present;
    });

    // Update or create charts with content.
    content.forEach(function (item, index) {
      // Update existing.
      if (graph._containers[index]) {
        var chartContainer = graph._containers[index];
        chartContainer.setContentUpdateY(item); // refresh data and min, max
        if (chartContainer.path) {
          chartContainer.path.remove(); // Redraw every path, to prevent mixups.
          chartContainer.path = null; // Redraw every path, to prevent mixups.
        }
      }

      // Create new ones
      else {
        graph._containers[index] = new ChartContainer(item, temporal);
      }

    });

    if (graph._containers.length === 0) {
      return; // for the love of pete don't let it continue
    }

    // Create the y scales and axes for the updated charts.
    graph._yPerUnit = updateYs(
      graph._containers,
      graph._yPerUnit,
      graph.dimensions,
      width > MIN_WIDTH_INTERACTIVE_GRAPHS
    );

    var charts = graph._containers;

    // Draw all the charts in graph with their respective scales.
    charts.forEach(function (chart) {
      if (chart.data.length === 0) {
        return; // for the love of pete don't let it continue
      }

      graph._xy.y = graph._yPerUnit[chart.unit];

      var data = chart.data,
          keys = chart.keys,
          labels = chart.labels;

      chart.pathFn = graph._createLine(graph._xy, keys);

      var MIN_POINTS_FOR_SUBSET = 15,
          DELAY = 100, // ms
          DATA_REDUCTION_FACTOR = 5;

      if (transitioning && data.length > MIN_POINTS_FOR_SUBSET) {
        var fullData = _.clone(data);
        graph._registerTimeout(
          chart,
          function () {
            chart.path = drawPath(
              graph._svg,
              chart.pathFn,
              fullData,
              0, // transition 0 ms when drawing while zooming.
              chart.path,
              chart.color,
              chart.unit
            );
          },
          DELAY
        );
        data = getDataSubset(data, DATA_REDUCTION_FACTOR);
      }

      chart.path = drawPath(
        graph._svg,
        chart.pathFn,
        data,
        temporal ? 0 : graph.transTime, // Do not transition line graphs
                                       // when temporal.
        chart.path,
        chart.color,
        chart.unit
      );

    });

    // Draw one of the y axis
    drawMultipleAxes(graph);

    if (graph.dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS) {
      addLineInteraction(graph, temporal, content);
    }
  };

  /**
   * @function
   * @memberOf Graph
   * @param {object} barData - Object or Array with data, keys and labels
   *
   *         data   Currently supports arrays of arrays or objects
   *                        with x value, y value, <optional> color and
   *                        <optional> category.
   *         keys   Mapping between x, y and optional color, and
   *                        category values of data object: example:
   *                        {x: 0, y: 1} or:
   *                        {x: 'xValue', y: 'yValue', color: 'eventColor',
   *                        categoy: 'cat'};
   *         labels Object {x: 'x label', y: 'y label'} will be
   *                        mapped to axis labels of the graph
   * @param {string} scale  Whether the graph has a scale other than temporal.
   *                        If it is of a temporal nature the x-axis will by
   *                        default be the temporal axis.
   * @description           Draws a barchart, if necessary sets up the graph,
   *                        if necessary modifies domain and redraws axis,
   *                        and draws the line according to the data object.
   *                        Currently only a time scale on the x-axis is
   *                        supported. It assumes that every segment has a
   *                        data element.
   */
  Graph.prototype.drawBars = function (barData, scale) {
    var graph = this;

    var content = barData[0];
    graph._activeUnit = content.unit;

    var data = content.data;
    var keys = content.keys;
    var labels = { x: content.xLabel, y: content.unit };
    var originalKey = keys.y;
    if (keys.category) {
      // Create data for stacked bars.
      data = createYValuesForCumulativeData(data, keys);
      keys.y = 'y1';
    }

    var graphSizeChanged = function () {
      var scaleRangeMaxX = graph._xy.x.scale.range()[1];
      var scaleRangeMaxY = graph._xy.y.scale.range()[0];
      return scaleRangeMaxY !== graph.dimensions.height
      || scaleRangeMaxX !== graph.dimensions.width;
    };

    if (!graph._xy || graphSizeChanged()) {
      var options = {
        x: {
          scale: scale,
          orientation: 'bottom'
        },
        y: {
          scale: 'linear',
          orientation: 'left'
        }
      };
      graph._xy = graph._createXYGraph(data, keys, labels, options);
      graph._xy.y.scale.domain([0, graph._xy.y.maxMin.max]);
    }

    graph._xy = rescale(
      graph._svg,
      graph.dimensions,
      graph._xy,
      data,
      keys,
      {y: 0},
      graph._xDomain
    );

    drawLabel(graph._svg, graph.dimensions, labels.y, true);

    drawVerticalRects(
      graph._svg,
      graph.dimensions,
      graph._xy,
      keys,
      data,
      graph.transTime,
      graph._xDomain,
      graph._activeUnit,
      content.color
    );

    if (graph.dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS) {
      addInteractionToRects(
        graph._svg,
        graph.dimensions,
        graph._xy,
        keys,
        labels,
        graph._activeUnit
      );
    }

    addZoomToYaxis(
      graph._svg,
      graph._xy.y.axis,
      graph.dimensions,
      graph._activeUnit
    );

    // Object reference, put it back.
    keys.y = originalKey;
  };

  /**
   * @function
   * @memberOf Graph
   * @param {object}    data object. Currently supports the format:
   *                    [
   *                      {
   *                        "<key to color>": "<color str>",
   *                        "<value key": <value int>,
   *                        "<label key>": "<label>"
   *                      },
   *                      ...,
   *                    ]
   * @param {object} keys   Mapping between x values of data object:
   *                        example: {x: 'color'}
   * @param {object} labels Object {x: 'x label'} will be
   *                        mapped to axis labels of the graph
   * @description           If necessary an x-scale, axis, draws the
   *                        label and sets up a mousemove listener.
   *                        It draws the rectangles.
   */
    Graph.prototype.drawHorizontalStack = function (content) {
      var data = content[0].data,
          keys = content[0].keys,
          labels = { x: content.xLabel, y: content.unit };

      var options = {
        scale: 'linear',
        orientation: 'bottom',
        tickFormat: d3.format(".0%") // Custom tickFomat in percentages
      };
      this._x = createXGraph(this._svg, this.dimensions, labels, options);

      if (data === null || data.length === 1 && data[0] === null) {
        return; // We are done here.
      }

        // normalize data
        var total = d3.sum(data, function (d) {
        return d ? Number(d[keys.x]) : 0;
      });

      var dataCopy = angular.copy(data);

      angular.forEach(dataCopy, function (value, key) {
        var pixels = value[keys.x];
        value[keys.x] = pixels / total; // Percentage, is percentage of area with data

        var selectedGeometries = State.selected.geometries;
        if (selectedGeometries && selectedGeometries.length === 1 &&
            (selectedGeometries[0].geometry.type === 'Polygon' ||
             selectedGeometries[0].geometry.type === 'MultiPolygon')) {
          var selectedPolygon = selectedGeometries[0];
          var totalArea = selectedPolygon.area;
          if (value.total) {
            // This is the percentage of the whole requested area
            var percentageOfArea = pixels / value.total;
            var formattedArea = $filter('number')(
              Math.round(percentageOfArea * totalArea / 10000));
            value.extraLabel = "(" + formattedArea + " ha)";
          }
        }
      });

      drawHorizontalRects(this._svg, this.dimensions, this.transTime, this._x.scale, dataCopy, keys, labels);
  };

  /**
   * Draws an elevation profile, with monitoring well values as points and an
   * interpolation through the well values.
   *
   * Crosssection gets a combined y domain and the x domain of the line.
   *
   * Get range, domain, make scale and axis, draw everything.
   *
   * Data should look like this:
   *
   * content = {
   *   line: {
   *     data: [],
   *     keys: {}
   *   },
   *   points: [{x: int, value: int}]
   * };
   *
   * @param  {object} content data to plot
   */
  Graph.prototype.drawCrosssection = function (content) {
    if (!content.line.data) { return; }

    var width = this._getWidth(this.dimensions);
    var height = this._getHeight(this.dimensions);

    var xLineMinMax = this._maxMin(content.line.data, 0);

    var yLineMinMax = this._maxMin(content.line.data, 1);

    var maxY;
    var minY;

    var transTime = this._getTransTime();
    if (content.points.length) {
      var minimumPoint = _.minBy(content.points, function (p) {return p.value; });
      var maximumPoint = _.maxBy(content.points, function (p) {return p.value; });
      maxY = Math.max(yLineMinMax.max, maximumPoint.value);
      minY = Math.min(0, yLineMinMax.min, minimumPoint.value);
    }

    this._xy = {
      x: {
        minMax: {
          min: 0,
          max: xLineMinMax.max
        }
      },
      y: {
        minMax: {
          min: maxY || yLineMinMax.max,
          max: minY || yLineMinMax.min
        }
      }
    };

    var xRange = {min: 0, max: width};
    var yRange = {min: 0, max: height};

    this._xy.x.scale = this._makeScale(
      this._xy.x.minMax,
      xRange,
      {scale: 'linear'}
    );
    this._xy.x.axis = this._makeAxis(
      this._xy.x.scale,
      {orientation: 'bottom'}
    );
    this._drawAxes(
      this._svg,
      this._xy.x.axis,
      this.dimensions,
      false, // is not a y axis.
      0 // no transition of x axis
    );
    drawLabel(this._svg, this.dimensions, 'm', false);

    this._xy.y.scale = this._makeScale(
      this._xy.y.minMax,
      yRange,
      {scale: 'linear'}
    );
    this._xy.y.axis = this._makeAxis(
      this._xy.y.scale,
      {orientation: 'left', drawGrid: true}
    );
    drawAxes(
      this._svg,
      this._xy.y.axis,
      this.dimensions,
      true, // is a y axis.
      transTime
    );
    drawLabel(this._svg, this.dimensions, 'hoogte (mNAP)', true);

    var className = 'line';
    addLineToGraph(
      this._svg,
      transTime,
      content.line.data,
      {x: 0, y:1},
      this._xy,
      className
    );

    addPointsToGraph(this._svg, transTime, content.points, this._xy);

    className = 'interpolation-line';
    // Only use ts linked to freatic line.
    var linePoints = content.points.filter(function (p) { return p.linked; });
    addLineToGraph(
      this._svg,
      transTime,
      linePoints,
      {x: 'x', y: 'value'},
      this._xy,
      className
    );
  };

  /**
   * @function
   * @memberOf Graph
   * @param {int}    draw   Timestamp in ms from epoch
   * @description           draws the now according the
   *                        current active scale.
   */
  Graph.prototype.drawNow = function (now) {
      this._drawNow(now, this._xy.x.scale);
      // move to the front
      var el = this._svg.select('.now-indicator').node();
      el.parentNode.appendChild(el);
  };

  Graph.prototype._createXYGraph = function (data, keys, labels, options) {
      if (!options) {
        options = {
          x: {
            scale: 'linear',
            orientation: 'bottom'
          },
          y: {
            scale: 'linear',
            orientation: 'left'
          }
        };
      }

      var width = this._getWidth(this.dimensions);

      var xy = {x: {}, y: {}};

      angular.forEach(xy, function (value, key) {
        var y = key === 'y';
        options[key].drawGrid = width > MIN_WIDTH_INTERACTIVE_GRAPHS && y;
        xy[key] = this._createD3Objects(
          data,
          keys[key],
          options[key],
          y
        );
        drawAxes(this._svg, xy[key].axis, this.dimensions, y);
        drawLabel(this._svg, this.dimensions, labels[key], y);
      }, this);
      return xy;
  };

  /**
   * Registers a timeout with a cb and a delay. Calls the cb on the instance
   * of Graph after delay.
   *
   * @param {function} cb function to call on graph instance when timeout
   *                      resolves.
   * @param {int} delay in ms of the cb execution.
   */
  Graph.prototype._registerTimeout = function(chart, cb, delay) {
      if (chart.timeout) {
        $timeout.cancel(chart.timeout);
      }

      var graph = this;

      chart.timeout = $timeout(
        function () {
          cb.call(graph); },
        delay,
        false // Do not trigger unnecessary digest loop
      );
  };

  Graph.prototype.drawCircleOnLine = function (xLocation, remove) {
    var R = 5; // radius of dot.

    var fg = this._svg.select('#feature-group');

    // Move listener rectangle to the front
    var el = this._svg.select('#listeners').node();
        el.parentNode.appendChild(el);

    var g = fg.select('.interaction-group');
    if (remove) {
      g.selectAll('circle').remove();
    }

    var chart = this._containers[0];
    var i = UtilService.bisect(chart.data, chart.keys.x, xLocation);
    var d = chart.data[i];

    if (!d) { return; }

    var x = this._xy.x.scale(d[chart.keys.x]);
    var y;
    // If d has a y value, use it. Otherwise show dot at bottom of chart.
    if (d[chart.keys.y] || d[chart.keys.y] === 0) {
      y = this._xy.y.scale(d[chart.keys.y]);
    }
    else {
      y = this._xy.y.scale.range()[0] - R;
    }

    if (!g[0][0]) {
      g = fg.append('g').attr('class', 'interaction-group');
    } else {
      g.selectAll('circle').remove();
    }

    g.append('circle')
      .attr('r', R)
      .attr('cx', x)
      .attr('cy', y)
      .transition()
      .ease('easeInOut')
      .duration(100)
      .attr('r', 3);
  };

  /**
   * Returns this.transTime first time called or when last called a long time
   * ago, otherwise returns zero. Use it to determine transition duration.
   */
  Graph.prototype._getTransTime = function () {
    var transTime;
    var now = Date.now();
    var RENDER_BUFFER = 30; // Browsers need a few ms to render the transtion.

    if (now - this._lastTimeDrawWasCalled < RENDER_BUFFER + this.transTime) {
      transTime = 0;
    } else {
      transTime = this.transTime;
    }

    this._lastTimeDrawWasCalled = Date.now();

    return transTime;
  };


  /**
   * Draws and updates thresholds of charts.
   *
   * @param {svg}    svg        d3 svg.
   * @param {array}  charts     charts in graph.
   * @param {str}    activeUnit current active axis.
   * @param {array}  xRange     min, max range of graph in px.
   * @param {fn}     yScale     d3 scale for y axis.
   * @param {int}    duration   transition duration.
   */
  var addThresholds = function (svg, charts, activeUnit, xRange, yScale, duration) {
    var PADDING = 2; // px.

    // Get or create group for thresholds.
    var tg = svg.select('#feature-group').select('.thresholds');

    if (tg.empty()) {
      tg = svg.select('#feature-group')
        .append('g')
        .attr('class', 'thresholds');
    }

    var lines = tg.selectAll("line");
    var labels = tg.selectAll("text");

    if (charts) {
      // Get unique list of thresholds.
      var thresholds = [];

      charts.forEach(function (chart) {
        if (chart.unit === activeUnit) {
          chart.thresholds.forEach(function (threshold) {
            // XXX There is a bug
            // (https://github.com/nens/lizard-nxt/issues/2215#issuecomment-313606175)
            // That means relative thresholds *sometimes* aren't drawn. To make this
            // look better and to avoid confusing users, we *never*
            // draw them, not even when it would work.
            if (RTSLService.get() && threshold.reference_frame) {
              return;
            }

            // If we are looking at heights relative to ground level, we may need
            // to adjust the value here.
            var isRelative = (RTSLService.get() && threshold.reference_frame &&
                              !isNaN(threshold.surface_level));

            var value = threshold.value;
            if (isRelative) {
              value -= threshold.surface_level;
            }

            // addReferenceFrameToUnit also changes the reference frame depending on
            // relativity.
            var label = threshold.name + " " +
                        value.toFixed(2) + " " +
                        addReferenceFrameToUnit(activeUnit, threshold.reference_frame);

            thresholds.push({
              value: value,
              label: label
            });
          });
        }
      });

      // Thresholds are a property of chart, but come from an asset, so multiple
      // charts might have the same thresholds.
      thresholds = _.uniq(thresholds);

      // Create, update and remove thresholds.
      lines = lines.data(thresholds, function(d) { return d.label; });

      lines.enter().append('line')
        .attr('x1', 0)
        .attr('x2', xRange[1]);

      lines.exit().transition()
        .duration(duration)
        .style('stroke-width', 0)
        .remove();

      // Create, update, remove labels on threshold.
      labels = labels.data(thresholds, function(d) { return d.label; });

      labels.enter().append('text')
        .attr('x', PADDING)
        .text(function (d) { return d.label; });

      labels.exit().remove();
    }

    lines.transition()
      .duration(duration)
      .attr('y1', function (d) { return yScale(d.value); })
      .attr('y2', function (d) { return yScale(d.value); });

    labels.transition()
      .duration(duration)
      .attr('y', function (d) { return yScale(d.value) - PADDING; });
  };


  /**
   * Creates y cumulatie y values for elements on the same x value.
   *
   * @param  {array} data array of objects.
   * @param  {object} keys mapping between x, y and keys in the data.
   * @return {array} with added y0 value and cumulative y value.
   */
  var createYValuesForCumulativeData = function (data, keys) {
    var cumulativeData = [];
    // Group by x value
    d3.nest().key(function (d) {
      return d[keys.x];
    })
    .entries(data)
    // Compute y values for every group
    .forEach(function (group) {
      var y0 = 0;
      group.values = group.values.map(function (d) {
        d.y0 = y0;
        d.y1 = y0 + d[keys.y];
        y0 = d.y1;
        cumulativeData.push(d);
      });
    });

    return cumulativeData;
  };

  var needToRescale = function (data, key, limit, old, xDomain) {
    var newDomain;
    if (key === "y") {
      newDomain = Graph.prototype._maxMin(data, "y");
    } else {
      newDomain = xDomain
        ? { min: xDomain.start, max: xDomain.end }
        : Graph.prototype._maxMin(data, key);
    }
    return (
      newDomain.max > old.max ||
      newDomain.max < (limit * old.max) ||
      newDomain.min !== old.min
    );
  };

  /**
   * @function
   * @description Updates all of the Y containers for the graph based on all
   * the charts in this graph. It looks for similar units and calculates
   * the min and the max based on all of the items with the same unit.
   * In this way the charts can be compared and different y-axes calculated.
   * @param {object}   charts - ChartContainer object with y and data
   * @param {object}   yPerUnit - y characteristics (domain, scale, axis) per
   *                               unit of the graph
   * @param {object}   dimensions - object describing the size of the graph
   * @param {boolean}  drawGrid    to draw a grid or not.
   */
  var updateYs = function (charts, yPerUnit, dimensions, drawGrid) {
    var width = Graph.prototype._getWidth(dimensions);
    var options = {
      scale: 'linear',
      orientation: 'left',
      drawGrid: drawGrid
    };

    charts.forEach(function (chart) {

      var maxMin = Graph.prototype._maxMin(chart.data, chart.keys.y);
      var unitY = yPerUnit[chart.unit];

      // All maxes and minuses should be defined for the max/min comparison to
      // work.
      if (
        unitY
        && !_.isUndefined(chart.yMaxMin.min)
        && !_.isUndefined(chart.yMaxMin.max)
        && !_.isUndefined(unitY.maxMin.max)
        && !_.isUndefined(unitY.maxMin.min)
      ) {
        maxMin.min = Math.min(chart.yMaxMin.min, unitY.maxMin.min);
        maxMin.max = Math.max(chart.yMaxMin.max, unitY.maxMin.max);
      }

      yPerUnit[chart.unit] = {maxMin: maxMin};
    });

    _.forEach(yPerUnit, function (unitY) {
      unitY.range = Graph.prototype._makeRange('y', dimensions);
      unitY.scale = Graph.prototype._makeScale(unitY.maxMin, unitY.range, options);
      unitY.axis = Graph.prototype._makeAxis(unitY.scale, options, dimensions);
    });
    return yPerUnit;
  };

  var rescale = function (svg, dimensions, xy, data, keys, origin, xDomain) {
    // Sensible limits to rescale. If the max
    // of the y values is smaller than 0.2 (or 20 %) of the max of the scale,
    // update domain of the scale and redraw the axis.
    var limits = {
      x: 1,
      y: 0.2
    };
    var orientation = {
      x: 'bottom',
      y: 'left'
    };
    origin = origin || {};
    // Decide to rescale for each axis.
    angular.forEach(xy, function (value, key) {
      if (needToRescale(data, keys[key], limits[key], value.maxMin, xDomain)) {
        value.maxMin = key === "x" && xDomain
          ? { min: xDomain.start, max: xDomain.end }
          : Graph.prototype._maxMin(data, keys[key]);
        if (origin[key] === undefined) {
          origin[key] = value.maxMin.min;
        }
        var animationDuration = key === 'y' ? Graph.prototype.transTime : 0;
        var options = {orientation: orientation[key]};
        options.drawGrid = dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS && key === 'y';
        value.scale.domain([origin[key], value.maxMin.max]);
        value.axis = Graph.prototype._makeAxis(value.scale, options, dimensions);
        drawAxes(svg, value.axis, dimensions, key === 'y' ? true : false, animationDuration);
      }
    });
    return xy;
  };

  var addPointsToGraph = function (svg, duration, points, xy) {
    var xScale = xy.x.scale;
    var yScale = xy.y.scale;

    // Join new points to svg circles
    var circles = svg.select('g').select('#feature-group').selectAll("circle")
      .data(points, function(d) { return d.id; });

    // UPDATE
    // Update elements start and width as needed.
    circles.transition()
      .duration(duration)
      .attr("cx", function (d) { return xScale(d.x); })
      .attr('cy', function (d) { return yScale(d.value); });
    // ENTER
    // Create new elements as needed.
    circles.enter().append("circle")
      .attr("cx", function (d) { return xScale(d.x); })
      .attr('cy', function (d) { return yScale.range()[1]; })
      .attr("class", "point")
      .transition()
      .duration(duration)
      .attr('cy', function (d) { return yScale(d.value); })
      .attr('r', 8);
    // EXIT
    // Remove old elements as needed. First transition to width = 0
    // and then remove.
    circles.exit()
      .transition()
      .duration(duration)
      .attr('r', 0)
      .remove();
  };

  /**
   * Adds a line to a graph. Assumes xy contains d3 scales and className
   * describes a unique line.
   */
  var addLineToGraph = function (svg, duration, data, keys, xy, className) {
    var xScale = xy.x.scale;
    var yScale = xy.y.scale;

    var path = d3.svg.line()
      .interpolate('basis') // Goes nicely in between the points. Makes it look
                            // very scientific.
      .x(function (d) { return xScale(d[keys.x]); })
      .y(function (d) { return yScale(d[keys.y]); })
      // interrupt the line when no data
      .defined(function (d) { return !isNaN(parseFloat(d[keys.y])); });

    // generate line paths
    var line = svg.select('#feature-group').selectAll("." + className)
      .data([data]).attr("class", className);

    // Create the line
    line.enter()
      .append("path")
      .attr("class", className)
      .attr("d", function (d) { return path(d); });

    // Update the line
    line.transition().duration(duration)
      .attr("d", path);
  };

  var drawHorizontalRects = function (svg, dimensions, duration, scale, data, keys, labels) {
    var width = Graph.prototype._getWidth(dimensions),
        height = Graph.prototype._getHeight(dimensions),
        DEFAULT_BAR_COLOR = "#7f8c8d", // $asbestos is the default color for bars
        previousCumu = 0;

    // Create a start and end for each rectangle.
    angular.forEach(data, function (value) {
      value.start = previousCumu;
      previousCumu += value[keys.x];
    });

    // Data should be normalized between 0 and 1.
    var total = 1;

    // Join new data with old elements, based on the y key.
    var rects = svg.select('g').select('#feature-group').selectAll(".horizontal-rect")
      .data(data, function (d) { return d[keys.y]; });

    // UPDATE
    // Update elements start and width as needed.
    rects.transition()
      .duration(duration)
      .attr("x", function (d) { return scale(d.start); })
      .attr('width', function (d) { return scale(d[keys.x]); });
    // ENTER
    // Create new elements as needed.
    rects.enter().append("rect")
      .style("fill", function (d) { return d.color || DEFAULT_BAR_COLOR; })
      .attr("x", function (d) { return scale(d.start); })
      .attr("y", 0)
      .attr('class', 'horizontal-rect')
      .attr("height", height)
      .transition()
      .duration(duration)
      .attr('width', function (d) { return scale(d[keys.x]); });
    // EXIT
    // Remove old elements as needed. First transition to width = 0
    // and then remove.
    rects.exit()
      .transition()
      .duration(duration)
      .attr('width', 0)
      .remove();

    // Rects set their value on the label axis when hoovered
    rects.on('mousemove', function (d) {
      var label;
      var labelstr = d.label;
      if (d.label === -1 || d.label.split === undefined) {
        label = Math.round(d[keys.x] * 100) + "% overig";
      } else {
        labelstr = d.label.split('-');
        label = Math.round(d[keys.x] * 100) + '% ' + labelstr[labelstr.length - 1];
      }

      if (d.extraLabel) {
        label += ' ' + d.extraLabel;
      }

      svg.select('#xlabel')
        .text(label)
        .attr("class", "selected");

      // Correct height so label fits within svg.
      var mv = - 0.5 * svg.select('#xlabel').node().getBBox().height;
      svg.select('#xlabel')
        .attr('dy', mv);
    });

    // When the user moves the mouse away from the graph, put the original
    // label back in place.
    rects.on('mouseout', function (d) {
      svg.select('#xlabel')
        .text(labels.x)
        .classed({"selected": false});
    });
  };

    /**
     * @function
     * @memberOf Graph
     * @description Draws the vertival rectangles of a barchart.
     * @param {svg}    svg    d3 svg.
     * @param {Object} dimensions   object with graph size and padding.
     * @param {Object} xy     d3 scales
     * @param {array} data    array of objects.
     * @param {object} keys   mapping between x, y and keys in the data.
     * @param {int}    duration   transition duration.
     * @param {object} xDomain - override the domain for the graphs.
     * @param {str}    activeUnit current active axis.
     * @param {string} color  Barchart color. This color is overruled by the
     *                        color for each datapoint if this is available in
     *                        data. When this color is not set and no color is
     *                        defined a datapoint that bar will remain gray.
     */
  var drawVerticalRects = function (svg, dimensions, xy, keys, data, duration,
                                    xDomain, activeUnit, color) {

    var width = Graph.prototype._getWidth(dimensions),
        height = Graph.prototype._getHeight(dimensions),
        x = xy.x,
        y = xy.y,
        MIN_BAR_WIDTH = 2,
        barWidth = Math.max(
          MIN_BAR_WIDTH,
          Math.floor(
            getBarWidth(xy.x.scale, data, keys, dimensions, xDomain)
          )
        ),
        strokeWidth = barWidth === MIN_BAR_WIDTH ? 0 : 1,

        // Join new data with old elements, based on the x key.
        bar = svg.select('#feature-group').selectAll(".bar")
          .data(
            data,
            function (d) {
              if (d[keys.category]) {
                return d[keys.x] + d[keys.category];
              } else {
                return d[keys.x];
              }
            }
          ).attr("class", "bar unit-" + UtilService.slugify(activeUnit));

    // Aggregated events explicitly have an interval property which correspond
    // to a pixel size when parsed by scale function.
    var widthFn = function (d) {
      var width;
      if (d.hasOwnProperty('interval')) {
        width = xy.x.scale(d.interval) - xy.x.scale(0);
      }
      else {
        width = barWidth;
      }
      return width;
    };

    // UPDATE
    bar
      // change x when bar is invisible:
      .attr("x", function (d) { return x.scale(d[keys.x]) - widthFn(d); })
      // change width when bar is invisible:
      .attr('width', widthFn);
    bar
      .transition()
      .duration(duration)
        .style("fill", function (d) { return d[keys.color] || color || ''; })
        .attr("height", function (d) {
          return y.scale(d.y0) - y.scale(d[keys.y]) || height - y.scale(d[keys.y]);
        })
        .attr("y", function (d) { return y.scale(d[keys.y]); })
    ;

    // ENTER
    // Create new elements as needed.
    bar.enter().append("rect")
      .attr("class", "bar unit-" + UtilService.slugify(activeUnit))
      .attr("x", function (d) { return x.scale(d[keys.x]) - widthFn(d); })
      .attr('width', widthFn)
      .attr("y", function (d) { return y.scale(0); })
      .attr("height", 0)
      .style("fill", function (d) { return  d[keys.color] || color || ''; })
      .attr("stroke-width", strokeWidth)
      .transition()
      .duration(duration)
        // Bring bars in one by one
        // .delay(function (d, i) { return i * 0.1 * duration * 2; })
        .attr("height", function (d) {
          return y.scale(d.y0) - y.scale(d[keys.y]) || height - y.scale(d[keys.y]);
        })
        .attr("y", function (d) { return y.scale(d[keys.y]); });

    // EXIT
    // Remove old elements as needed.
    bar.exit()
      .transition()
      .duration(duration)
      .attr("y", height)
      .attr("height", 0)
      .remove();
  };

  var getBarWidth = function (scale, data, keys, dimensions, xDomain) {

    if (data.length === 0) {
      // Apparently, no data is present: return a dummy value since nothing
      // is to be drawn.
      return 0;
    }

    else {
      var firstDatum = data[0],
          lastDatum = data[data.length - 1];

      return  Math.floor(
        (scale(lastDatum[keys.x]) - scale(firstDatum[keys.x])) / (data.length - 1)
      );
    }

  };


  var addInteractionToRects = function (svg, dimensions, xy, keys, labels, activeUnit) {
    var unitClass = "unit-" + UtilService.slugify(activeUnit);
    var height = Graph.prototype._getHeight(dimensions),
      width = Graph.prototype._getWidth(dimensions),
        fg = svg.select('#feature-group');

    var cb = function (d) {
      removeAllSelection();
      d3.select(this).attr('class', 'selected bar ' + unitClass);
      var g = fg.append('g').attr('class', 'interaction-group');


      var text = Math.round(d[keys.y] * 100) / 100 + ' ' + labels.y;
      text = keys.category !== undefined
        ? text + ' ' + d[keys.category]
        : text;

      var t  = g.append('text').text(text);

      var tHeight = t.node().getBBox().height,
          tWidth = t.node().getBBox().width;

      var BOX_PADDING_WIDTH = 10;
      var BOX_PADDING_HEIGHT = 5;
      var TEXY_PADDING_WIDTH = BOX_PADDING_HEIGHT;

      var bgY = Math.min(
        height - tHeight - BOX_PADDING_HEIGHT,
        xy.y.scale(d.y1 || d[keys.y])
      );

      var textY = Math.min(
        height - 0.5 * tHeight,
        xy.y.scale(d.y1 || d[keys.y]) + tHeight
      );

      var bgX = Math.min(
        width - tWidth - BOX_PADDING_WIDTH,
        xy.x.scale(d[keys.x])
      );

      var textX = Math.min(
        width - tWidth,
        xy.x.scale(d[keys.x]) + TEXY_PADDING_WIDTH
      );

      g.append('rect')
        .attr('class', 'tooltip-background')
        .attr('x', bgX)
        .attr('y', bgY)
        .attr('width', tWidth + BOX_PADDING_WIDTH)
        .attr('height', tHeight + BOX_PADDING_HEIGHT);

      t.attr('x', textX)
        .attr('y', textY);

      t.node().parentNode.appendChild(t.node());
    };

    var removeAllSelection = function () {
      fg.selectAll('.bar').attr('class', "bar " + unitClass);
      fg.select('.interaction-group').remove();
    };

    fg.selectAll('.bar').on('click', cb);
    fg.selectAll('.bar').on('mousemove', cb);
    fg.selectAll('.bar').on('mouseout', function () {
      removeAllSelection();
    });
  };

  var createXGraph = function (svg, dimensions, labels, options) {
    var x = {};
    if (!options) {
      options = {
        scale: 'linear',
        orientation: 'bottom'
      };
    }
    var width = Graph.prototype._getWidth(dimensions),
    range = {min: 0, max: width},
    // Axis should run from zero to 100%
    domain = {min: 0, max: 1};
    x.scale = Graph.prototype._makeScale(domain, range, {scale: options.scale});
    x.axis = Graph.prototype._makeAxis(x.scale, options);
    drawAxes(svg, x.axis, dimensions, false);
    drawLabel(svg, dimensions, labels.x, false);
    return x;
  };

  var drawPath = function (svg, pathFn, data, duration, path, color, unit) {
    if (!path) {
      var fg = svg.select('g').select('#feature-group');
      // bring to front
      fg.node().parentNode.appendChild(fg.node());
      path = fg.append("path")
        .attr("class", "line unit-" + UtilService.slugify(unit));
    }
    path.datum(data)
      .style('stroke', color)
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        // Prevent returning invalid values for d
        return pathFn(d) || "M0, 0";
      });
    return path;
  };

  /**
   * When hovering show information on the data in the lines in the graph.
   *
   * @params {object} - the graph object (all-encompassing, ever-faithful)
   */
  var addLineInteraction = function (graph, temporal, content) {
    var height = graph._getHeight(graph.dimensions),
        fg = graph._svg.select('#feature-group'),
        MIN_LABEL_Y = 50,
        LABEL_PADDING_X = 10,
        LABEL_PADDING_Y = 5,
        xy = graph._xy;

    var duration = 0.3; // zoing

    // Move listener rectangle to the front
    var el = graph._svg.select('#listeners').node();
        el.parentNode.appendChild(el);

    var cb = function () {
      var boundingRect = this; // `this` is otherwise lost in foreach

      var values = [];
      var x2, xText; // needed for the time.

      angular.forEach(graph._containers, function (chart, id) {
        if (chart.data.length === 0) { return true; }
        var i = UtilService.bisect(chart.data, chart.keys.x, xy.x.scale.invert(d3.mouse(boundingRect)[0]));
        i = i === chart.data.length ? chart.data.length - 1 : i;
        var d = chart.data[i];
        var value = chart.keys.y.hasOwnProperty('y1') ? d[chart.keys.y.y1] : d[chart.keys.y];
        if (d[chart.keys.x] === null || d[chart.keys.y] === null) { return; }

        x2 = xy.x.scale(d[chart.keys.x]);
        var y2 = graph._yPerUnit[chart.unit].scale(value);
        xText = (temporal) ? new Date(chart.data[i][chart.keys.x]).toLocaleString() : chart.data[i][chart.keys.x].toFixed(2);

        if (!chart.labels) {
          chart.labels = {y:''};
        }

        values.push({
          x: x2,
          y: y2,
          location: chart.location,
          ylabel: chart.labels.y,
          unit: chart.unit,
          reference_frame: chart.reference_frame,
          name: chart.name,
          value: value,
          color: chart.color
        });
      });

      if (values.length === 0) { return true; }

      var g = fg.select('.interaction-group');
      var valuebox = fg.select('.valuebox');
      var textLength;

      if (!g[0][0]) {
        g = fg.append('g').attr('class', 'interaction-group');
        valuebox = g.append('g').attr('class', 'valuebox');
        valuebox.append('rect');
        valuebox.append('text');
        g.append('line');
      } else {
        g.selectAll('circle').remove();
        g.selectAll('tspan').remove();
        g.selectAll('text.graph-tooltip-x').remove();
      }

      valuebox
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 100)
        .attr('height', 20 * values.length - 1);

      g.select('line')
        .attr('y1', height)
        .attr('y2', 0)
        .attr('x1', x2)
        .attr('x2', x2);

      values.forEach(function (v, i) {
        var value = v.value.toFixed ? v.value.toFixed(2): '...';
        g.append('circle')
          .attr('r', 0)
          .attr('cx', v.x)
          .attr('cy', v.y)
          .transition()
          .ease('easeInOut')
          .duration(duration)
          .attr('r', 5);
          var texty2 = Math.max(v.y - LABEL_PADDING_Y, MIN_LABEL_Y);

        valuebox.select('rect')
          .attr('fill', 'white')
          .attr('x', 5)
          .attr('y', 0)
          .attr('width', 100)
          .attr('height', 20 + 15 * i);
        valuebox
          .append('circle')
            .attr('r', 4)
            .attr('cx', 15)
            .attr('cy', 10 + 15 * i)
            .attr('stroke', 'none')
            .attr('fill', v.color);

        var location = (v.location) ? v.location : '';
        var name = (v.name) ? ', ' + v.name : '';

        var parameter;
        try {
          parameter = content[0].parameter;
        } catch (e) {
          parameter = '';
        }

        var unit;
        if (v.ylabel) {
          unit = v.ylabel;
        } else {
          unit = addReferenceFrameToUnit(v.unit, v.reference_frame);
        }

        var boxText = value + ' ' + unit + ' - ' + location;
        if (parameter !== '') {
          boxText += ", " + parameter;
        }

        var tspan = valuebox.select('text')
          .append('tspan')
            .text(boxText)
            .attr('class', 'graph-tooltip-y')
            .attr('x', 25)
            .attr('y', 15 + 15 * i);

        textLength = (textLength) ? textLength : 0;
        textLength = Math.max(tspan[0][0].getComputedTextLength(), textLength);
        valuebox.select('rect')
          .attr('width', textLength + 25);
      });
      g.append('text')
        .text(xText)
        .attr('class', 'graph-tooltip-x')
        .attr('x', x2 + LABEL_PADDING_X)
        .attr('y', height - LABEL_PADDING_Y);
    };

    graph._svg.select('#listeners').on('click', cb);
    graph._svg.select('#listeners').on('mousemove', cb);
    graph._svg.select('#listeners').on('mouseout', function () {
      fg.select('.interaction-group').remove();
    });

  };

  var addInteractionToPath = function (svg, dimensions, data, keys, labels, path, xy, duration) {
    var bisect = d3.bisector(function (d) { return d[keys.x]; }).right,
        height = Graph.prototype._getHeight(dimensions),
        fg = svg.select('#feature-group'),
        MIN_LABEL_Y = 50,
        LABEL_PADDING_X = 10,
        LABEL_PADDING_Y = 5;

    // Move listener rectangle to the front
    var el = svg.select('#listeners').node();
    el.parentNode.appendChild(el);

    var cb = function () {
      fg.select('.interaction-group').remove();

      var i = bisect(data, xy.x.scale.invert(d3.mouse(this)[0]));
      i = i === data.length ? data.length - 1 : i;
      var d = data[i];
      var value = keys.y.hasOwnProperty('y1') ? d[keys.y.y1] : d[keys.y];

      if (d[keys.x] === null || d[keys.y] === null) { return; }

      var y2 = xy.y.scale(value),
          x2 = xy.x.scale(d[keys.x]),
          xText = new Date(data[i][keys.x]).toLocaleString();

      var g = fg.append('g').attr('class', 'interaction-group');

      g.append('circle')
        .attr('r', 0)
        .attr('cx', x2)
        .attr('cy', y2)
        .transition()
        .ease('easeInOut')
        .duration(duration)
        .attr('r', 5);
      g.append('line')
        .attr('y1', y2)
        .attr('y2', y2)
        .attr('x1', 0)
        .attr('x2', x2);
      g.append('line')
        .attr('y1', height)
        .attr('y2', y2)
        .attr('x1', x2)
        .attr('x2', x2);

      var texty2 = Math.max(y2 - LABEL_PADDING_Y, MIN_LABEL_Y);

      g.append('text')
        .text(Math.round(value * 100) / 100 + ' ' + labels.y)
        .attr('class', 'graph-tooltip-y')
        .attr('x', LABEL_PADDING_X)
        .attr('y', texty2 - LABEL_PADDING_Y);
      g.append('text')
        .text(xText + ' ' + labels.x)
        .attr('class', 'graph-tooltip-x')
        .attr('x', x2 + LABEL_PADDING_X)
        .attr('y', height - LABEL_PADDING_Y);
    };

    svg.select('#listeners').on('click', cb);
    svg.select('#listeners').on('mousemove', cb);
    svg.select('#listeners').on('mouseout', function () {
      fg.select('.interaction-group').remove();
    });

  };

  /**
   * Draws or updates graph axis labels.
   * @param  {object}       d3 selection svg
   * @param  {object}       dimensions
   * @param  {string}       (optional) label, if undefined uupdates current.
   * @param  {boolean}      draw on y axis, else x-axis.
   */
    var drawLabel = function (svg, dimensions, label, y) {
    var width = Graph.prototype._getWidth(dimensions),
        height = Graph.prototype._getHeight(dimensions),
        mv,
        // For some reason the x label needs to move a little bit more than
        // expected and the y label a little bit less.
        PIXEL_CORRECTION = 2,
        el = svg.select(y ? '#ylabel': '#xlabel');
    if (el.empty()) {
      el = svg.append('g')
        .append("text")
        .attr('class', 'graph-text graph-label')
        .style("text-anchor", "middle")
        .text(label);
    }
    if (label) {
      el.text(label);
    }
    if (y) {
      el.attr('id', 'ylabel')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0)
        .attr('x', 0 - height / 2);
    } else {
      el.attr('id', 'xlabel')
        .attr('x', dimensions.padding.left + width / 2)
        .attr('y', dimensions.height);
    }

    mv = y
      ? 0.5 * el.node().getBBox().height + PIXEL_CORRECTION
      : - 0.5 * el.node().getBBox().height + PIXEL_CORRECTION;
    el.attr('dy', mv);
    return el;
  };

  /**
   * Enables zoom and pan on y-axis.
   *
   * It transforms the position of paths on user scroll, pinch or pan.
   * Elements with the line class and it explicitly redraws the thresholds. If
   * specified with a string indicating the activeUnit, it only zooms the paths
   * which have the unit in th class list and resets all other transforms.
   *
   * @param {d3 svg}  svg
   * @param {d3 axis} axis
   * @param {object}  dimensions
   * @param {string}  activeUnit the currently active unit.
   */
  var addZoomToYaxis = function (svg, axis, dimensions, activeUnit) {
    var DEFAULT_SELECTOR = ['path', '.line', '.bar'];
    var selector = activeUnit
      ? '.unit-' + UtilService.slugify(activeUnit)
      : DEFAULT_SELECTOR;

    // Reset transforms on all paths and .lines.
    svg.select('#feature-group').selectAll(DEFAULT_SELECTOR)
      .attr("transform", "translate(0,0)scale(1)");

    var zoomed = function () {
      Graph.prototype._drawAxes(svg, axis, dimensions, true);
      addThresholds(svg, null, null, null, axis.scale(), 0);
      svg.select('#feature-group').selectAll(selector)
        .attr(
          "transform", "translate(0," + d3.event.translate[1] + ")" +
          "scale(1, " + d3.event.scale + ")"
        );
    };

    var zoom = d3.behavior.zoom()
      .y(axis.scale())
      .scaleExtent([0.2, 5])
      .on("zoom", zoomed);

    svg.select('#listeners').call(zoom);

  };

  var drawAxes = function (svg, axis, dimensions, y, duration, activeUnit) {
    // Create elements and draw axis using nxtD3 method
    Graph.prototype._drawAxes(svg, axis, dimensions, y, duration);
    var axisEl;
    // Make graph specific changes to the x and y axis
    if (y) {

      axisEl = svg.select('#yaxis')
        .attr("class", "y-axis y axis")
        .selectAll("text")
          .style("text-anchor", "end")
          .attr('class', 'graph-text');

      addZoomToYaxis(svg, axis, dimensions, activeUnit);

    } else {
      axisEl = svg.select('#xaxis')
        .attr("class", "x-axis x axis")
        .selectAll("text")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .style("text-anchor", "end")
          .attr('class', 'graph-text')
          .attr("transform", "rotate(-25)");
    }

    return axisEl;
  };


  /**
   * Draws or updates graph axis labels, with multiple y's.
   * @param  {object}       d3 selection svg
   * @param  {object}       dimensions
   * @param  {string}       (optional) label, if undefined uupdates current.
   * @param  {boolean}      draw on y axis, else x-axis.
   * @param  {string}       unit (e.g. mNAP)
   * @param  {object}       axes - keeps track of active axis.
   */
  var drawMultipleAxes = function (graph) {
    var clickRect = graph._svg.select('.click-axis');
    if (clickRect.empty()) {
      clickRect = graph._svg.append('rect')
      .attr('class', 'click-axis clickable')
      .on('click', function (e) {
        setActiveAxis(graph, 1);
        if (graph.dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS) {
          addThresholds(
            graph._svg,
            graph._containers,
            graph._activeUnit,
            graph._xy.x.scale.range(),
            graph._yPerUnit[graph._activeUnit].scale,
            graph.transTime
          );
        }
      });
    }
    clickRect
      .attr('width', graph.dimensions.padding.left)
      .attr('height', graph.dimensions.height);
    setActiveAxis(graph, 0);
    if (graph.dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS) {
      addThresholds(
        graph._svg,
        graph._containers,
        graph._activeUnit,
        graph._xy.x.scale.range(),
        graph._yPerUnit[graph._activeUnit].scale,
        graph.transTime
      );
    }
  };

    /* Combine unit and reference frame into a single string, or use
       "MV" (maaiveld) as reference frame if the graph is relative to
       ground level.

      TODO: The 'MV' string isn't translated yet.
     */
    var addReferenceFrameToUnit = function (unit, reference_frame) {
      if (!reference_frame) {
        return unit;
      }
      if (RTSLService.get()) {
        return unit + ' (MV)'; // TODO: translate this string
      } else {
        return unit + ' (' + reference_frame + ')';
      }
    };


   /**
     * Determines which axis should be drawn and includes label and circles for
     * active datasets.
     *
     * @param  {Graph}        Graph instance.
     * @param  {int}          integer 0 to keep current unit, 1 for next.
     */
    var setActiveAxis = function (graph, up) {
    var units = Object.keys(graph._yPerUnit);
    var indexOfUnit = units.indexOf(graph._activeUnit) + up;
    if (indexOfUnit >= units.length || indexOfUnit === -1) {
      indexOfUnit = 0;
    }
    graph._activeUnit = units[indexOfUnit];
    drawAxes(
      graph._svg,
      graph._yPerUnit[graph._activeUnit].axis,
      graph.dimensions,
      true,
      graph.transTime,
      graph._activeUnit
    );

    var label = drawLabel(
      graph._svg,
      graph.dimensions,
      addReferenceFrameToUnit(graph._activeUnit, graph._containers[0].reference_frame),
      true
    );
    var activeCharts = graph._containers.filter(function (chart) {
      return chart.unit === graph._activeUnit;
    });

    if (graph.dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS) {
      var PADDING = 15;
      var SIZE = 6;
      var DELAY = 0.5; // times transTime
      var circles = d3.select(label.node().parentNode).selectAll('circle')
        .data(activeCharts, function (d) {return d.id; });

      circles
        .enter()
        .append('circle')
        .attr('r', 0)
        .attr('cx', SIZE)
        .attr('fill', function (d) {return d.color;})
        .attr('cy', function (d, i) {
          var box = label.node().getBBox();
          return -(box.x + box.width) - PADDING - i * PADDING;
        });

      circles
        .transition()
        .ease('polyInOut')
        .delay(graph.transTime)
        .duration(graph.transTime)
        .attr('r', SIZE)
        .attr('fill', function (d) {return d.color;})
        .attr('cy', function (d, i) {
          var box = label.node().getBBox();
          return -(box.x + box.width) - PADDING - i * PADDING;
        });

      circles.exit()
        .transition()
        .ease('polyInOut')
        .delay(function (d, i) { return i * graph.transTime * DELAY; })
        .duration(graph.transTime)
        .attr('r', 0)
      .remove();
    }
  };

  /**
   * Takes a data array and returns an array with length one/subsetFactor of the
   * input.
   *
   * It uses modulo to remove but every subsetFactor item in the array. As such
   * the result depends on the order of the input and it does not attempt to
   * simplify in a least intrusive way as e.g. douglas-peucker would. This is
   * probably faster though, which is the whole point.
   *
   * @param  {array}  data         array of data points to subset.
   * @param  {int}    subsetFactor describing how much smaller the subset should
   *                               be.
   * @return {array}               subset of data with lenght data.length /
   *                               subsetFactor.
   */
  var getDataSubset = function (data, subsetFactor) {
    return data.filter(function (item, index) {
      return index % subsetFactor === 0; // returns true for every subsetFactor
                                         // th item;
    });
  };

  return Graph;

}]);
