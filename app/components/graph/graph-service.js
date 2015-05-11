/**
 * @name Graph
 * @class angular.module('lizard-nxt')
  .Graph
 * @memberOf app
 *
 * @summary Service to create and update a graph
 *
 * @description Inject "Graph" and call new graph(<args>) to create a
 * graph. Currently the graph supports lines, bars, donut, and a flat
 * donut called horizontal stacked bar. The user may interact with
 * the graph through click and hover functions. Graph inherits from
 * NxtD3, a lower level d3 helper class.
 *
 * NOTE: The donut code is currently not used anywhere in lizard-client.
 *
 * Everything in the graphs is animated according to NxtD3.transTime.
 */
angular.module('lizard-nxt')
  .factory("Graph", ["$timeout", "NxtD3", function ($timeout, NxtD3) {

  var MIN_WIDTH_INTERACTIVE_GRAPHS = 400; // Only graphs bigger get mouseover
                                          // and click interaction.

  /**
   * @constructor
   * @memberOf angular.module('lizard-nxt')
  .Graph
   *
   * @param {object} element    svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {object} xDomainInfo - override the domain for the graphs.
   */
  function Graph(element, dimensions, xDomainInfo) {
    if (xDomainInfo && xDomainInfo.start && xDomainInfo.end) {
      NxtD3.call(this, element, dimensions, xDomainInfo.start, xDomainInfo.end);
      this._xDomainInfo = xDomainInfo;
    } else {
      NxtD3.call(this, element, dimensions);
    }
    this._svg = this._createDrawingArea();
  }

  Graph.prototype = Object.create(NxtD3.prototype, {

    constructor: Graph,

    resize: {
      value: function (newDim) {
        NxtD3.prototype.resize.call(this, newDim);
        this._svg = this._createDrawingArea();
        this._svg.selectAll('.axis').remove();
        this._x = null;
        this._xy = null;
        // reposition labels
        drawLabel(this._svg, this.dimensions, undefined, true);
        drawLabel(this._svg, this.dimensions, undefined, false);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {object}    data object. Currently supports the format:
     *                    [
     *                      {
     *                        "<key to color>": "<color str>",
     *                        "<value key": <value int>,
     *                        "<label key>": "<label>"
     *                      },
     *                      ...,
     *                    ]
     * @description       If necessary creates a d3 pie and arc and
     *                    draws the features in the data element.
     */
    drawDonut: {
      value: function (data) {
        if (!this.dimensions.r || this._arc || this._pie) {
          this._donut = createDonut(this.dimensions);
        }
        drawPie(this._svg, this.dimensions, this._donut, data);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt').Graph
     * @param {object} data   Currently supports the format:
     *                        [
     *                          [value, value],
     *                          ...,
     *                        ]
     * @param {object} keys   Mapping between x and y values of data object:
     *                        example: {x: 0, y: 1}
     * @param {object} labels Object {x: 'x label', y: 'y label'} will be
     *                        mapped to axis labels of the graph
     * @param {boolean} temporal to draw an time axis or not.
     * @param {boolean} transitioning to draw a subset of data now, and the full
     *                                set after a timeout if drawline is not
     *                                called again before the timeout finishes.
     *                                Use transitioning = true when callig this
     *                                function many times as a result of a user
     *                                induced action.
     * @description           Draws a line, if necessary sets up the graph,
     *                        if necessary modifies domain and redraws axis,
     *                        and draws the line according to the data object.
     *                        Currently only a linear scale on the x-axis is
     *                        supported.
     */
    drawLine: {
      value: function (data, keys, labels, temporal, transitioning) {
        if (!this._xy) {
          var options = {
            x: {
              scale: 'time',
              orientation: 'bottom'
            },
            y: {
              scale: 'linear',
              orientation: 'left'
            }
          };
          // pass options for time graph or use defaults
          this._xy = this._createXYGraph(
            data,
            keys,
            labels,
            temporal ? options : undefined,
            this._xDomainInfo
          );
        } else {
          this._xy = rescale(
            this._svg,
            this.dimensions,
            this._xy,
            data,
            keys,
            null,
            this._xDomainInfo
          );
          drawLabel(this._svg, this.dimensions, labels.y, true);
        }

        var lineAsArea = keys.y.hasOwnProperty('y0')
          && keys.y.hasOwnProperty('y1');

        var pathFn = lineAsArea
          ? this._createArea(this._xy, keys)
          : this._createLine(this._xy, keys);

        var MIN_POINTS_FOR_SUBSET = 15,
            DELAY = 10, // ms
            DATA_REDUCTION_FACTOR = 5;

        if (transitioning && data.length > MIN_POINTS_FOR_SUBSET) {
          this._registerTimeout(
            function () {
              this._path = drawPath(
                this._svg,
                pathFn,
                data,
                0, // transition 0 ms when drawing while zooming.
                this._path,
                lineAsArea ? null : 'none'
              );
            },
            DELAY // delay with 30 ms
          );

          data = getDataSubset(data, DATA_REDUCTION_FACTOR);
        }

        this._path = drawPath(
          this._svg,
          pathFn,
          data,
          temporal ? 0 : this.transTime, // Do not transition line graphs
                                         // when temporal.
          this._path,
          lineAsArea ? null : 'none' // Set fill to 'none' for normal
                                     // lines.
        );

        if (this.dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS) {
          addInteractionToPath(
            this._svg,
            this.dimensions,
            data,
            keys,
            labels,
            this._path,
            this._xy,
            this.transTime
          );
        }

      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt').Graph
     * @param {object} data   Currently supports arrays of arrays or objects
     *                        with x value, y value, <optional> color and
     *                        <optional> category.
     * @param {object} keys   Mapping between x, y and optional color, and
     *                        category values of data object: example:
     *                        {x: 0, y: 1} or:
     *                        {x: 'xValue', y: 'yValue', color: 'eventColor',
     *                        categoy: 'cat'};
     * @param {object} labels Object {x: 'x label', y: 'y label'} will be
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
    drawBars: {
      value: function (data, keys, labels, scale) {
        var originalKey = keys.y;
        if (keys.category) {
          // Create data for stacked bars.
          data = createYValuesForCumulativeData(data, keys);
          keys.y = 'y1';
        }
        if (!this._xy) {
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
          this._xy = this._createXYGraph(data, keys, labels, options);
          this._xy.y.scale.domain([0, this._xy.y.maxMin.max]);
        }

        this._xy = rescale(
          this._svg,
          this.dimensions,
          this._xy,
          data,
          keys,
          {y: 0},
          this._xDomainInfo
        );

        drawLabel(this._svg, this.dimensions, labels.y, true);

        drawVerticalRects(
          this._svg,
          this.dimensions,
          this._xy,
          keys,
          data,
          this.transTime,
          this._xDomainInfo
        );

        if (this.dimensions.width > MIN_WIDTH_INTERACTIVE_GRAPHS) {
          addInteractionToRects(
            this._svg,
            this.dimensions,
            this._xy,
            keys,
            labels,
            this.transTime
          );
        }

        // Object reference, put it back.
        keys.y = originalKey;
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt').Graph
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
    drawHorizontalStack: {
      value: function (data, keys, labels) {
        if (!this._x) {
          var options = {
            scale: 'linear',
            orientation: 'bottom',
            tickFormat: d3.format(".0%") // Custom tickFomat in percentages
          };
          this._x = createXGraph(this._svg, this.dimensions, labels, options);
        }
        // normalize data
        var total = d3.sum(data, function (d) {
          return Number(d[keys.x]);
        });
        angular.forEach(data, function (value, key) {
          value[keys.x] = value[keys.x] / total;
        });
        drawHorizontalRects(this._svg, this.dimensions, this.transTime, this._x.scale, data, keys, labels);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {function} callback
     * @description      Sets a listener on the drawing rectangle
     *                   and on mousemove calls the callback with
     *                   the current position on the drawing area.
     */
    followMouse: {
      value: function (callback) {
         // Move listener rectangle to the front
        var el = this._svg.select('g').select('#listeners').node();
        el.parentNode.appendChild(el);
        var scale = this._xy.x.scale;
        this._svg.select('g').select('#listeners')
          .on('mousemove', function () {
            var pos = scale.invert(d3.mouse(this)[0]);
            callback(pos);
          });
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {function} callback
     * @description      Sets a listener on the drawing rectangle
     *                   and on mouseout calls the callback.
     */
    mouseExit: {
      value: function (callback) {
        this._svg.select('g').select('#listeners')
          .on('mouseout', function () {
            callback();
          });
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {int}    draw   Timestamp in ms from epoch
     * @description           draws the now according the
     *                        current active scale.
     */
    drawNow: {
      value: function (now) {
        this._drawNow(now, this._xy.x.scale);
        // move to the front
        var el = this._svg.select('.now-indicator').node();
        el.parentNode.appendChild(el);
      }
    },

    _createXYGraph: {
      value: function (data, keys, labels, options) {
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
        var xy = {x: {}, y: {}};

        angular.forEach(xy, function (value, key) {
          var y = key === 'y';
          xy[key] = this._createD3Objects(data, keys[key], options[key], y);
          drawAxes(this._svg, xy[key].axis, this.dimensions, y);
          drawLabel(this._svg, this.dimensions, labels[key], y);
        }, this);
        return xy;
      }
    },

    /**
     * Registers a timeout with a cb and a delay. Calls the cb on the instance
     * of Graph after delay.
     *
     * @param {function} cb function to call on graph instance when timeout
     *                      resolves.
     * @param {int} delay in ms of the cb execution.
     */
    _registerTimeout: {
      value: function(cb, delay) {
        if (this.timeout) {
          $timeout.cancel(this.timeout);
        }

        var graph = this;

        this.timeout = $timeout(
          function () {
            cb.call(graph); },
          delay,
          false // Do not trigger unnecessary digest loop
        );
      }
    }

  });

  var createPie, createArc, drawPie, drawAxes, drawLabel, needToRescale,
      drawPath, setupLineGraph, createDonut, addInteractionToPath, getBarWidth,
      drawVerticalRects, addInteractionToRects, drawHorizontalRects,
      createXGraph, rescale, createYValuesForCumulativeData, getDataSubset;

  /**
   * Creates y cumulatie y values for elements on the same x value.
   *
   * @param  {array} data array of objects.
   * @param  {object} keys mapping between x, y and keys in the data.
   * @return {array} with added y0 value and cumulative y value.
   */
  createYValuesForCumulativeData = function (data, keys) {
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

  needToRescale = function (data, key, limit, old, xDomainInfo) {
    var newDomain;
    if (key === "y") {
      newDomain = Graph.prototype._maxMin(data, "y");
    } else {
      newDomain = xDomainInfo
        ? { min: xDomainInfo.start, max: xDomainInfo.end }
        : Graph.prototype._maxMin(data, key);
    }
    return (
      newDomain.max > old.max ||
      newDomain.max < (limit * old.max) ||
      newDomain.min !== old.min
    );
  };

  rescale = function (svg, dimensions, xy, data, keys, origin, xDomainInfo) {
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
      if (needToRescale(data, keys[key], limits[key], value.maxMin, xDomainInfo)) {
        value.maxMin = key === "x" && xDomainInfo
          ? { min: xDomainInfo.start, max: xDomainInfo.end }
          : Graph.prototype._maxMin(data, keys[key]);
        if (origin[key] === undefined) {
          origin[key] = value.maxMin.min;
        }
        value.scale.domain([origin[key], value.maxMin.max]);
        value.axis = Graph.prototype._makeAxis(value.scale, {orientation: orientation[key]});
        drawAxes(svg, value.axis, dimensions, key === 'y' ? true : false, Graph.prototype.transTime);
      }
    });
    return xy;
  };

  drawHorizontalRects = function (svg, dimensions, duration, scale, data, keys, labels) {
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
      if (d.label === -1) {
        label = Math.round(d[keys.x] * 100) + "% overig";
      } else {
        var labelstr = d.label.split('-');
        label = Math.round(d[keys.x] * 100) + '% ' + labelstr[labelstr.length - 1];
      }

      svg.select('#xlabel')
        .text(label)
        .attr("class", "selected");
    });

    // When the user moves the mouse away from the graph, put the original
    // label back in place.
    rects.on('mouseout', function (d) {
      svg.select('#xlabel')
        .text(labels.x)
        .classed({"selected": false});
    });
  };

  drawVerticalRects = function (svg, dimensions, xy, keys, data, duration, xDomainInfo) {
    // We update the domain for X, if xDomainInfo was set...
    if (xDomainInfo && xDomainInfo.start && xDomainInfo.end) {
      xy.x.scale.domain([xDomainInfo.start, xDomainInfo.end]);
    }

    var width = Graph.prototype._getWidth(dimensions),
        height = Graph.prototype._getHeight(dimensions),
        x = xy.x,
        y = xy.y,
        MIN_BAR_WIDTH = 2,
        barWidth = Math.max(
          MIN_BAR_WIDTH,
          Math.floor(
            getBarWidth(xy.x.scale, data, keys, dimensions, xDomainInfo)
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
          );

    // UPDATE
    bar
      .transition()
      .duration(duration)
        // change x when bar is invisible:
        .attr("x", function (d) { return x.scale(d[keys.x]) - barWidth; })
        // change width when bar is invisible:
        .attr('width', function (d) { return barWidth; })
        .style("fill", function (d) { return d[keys.color] || ''; })
          .transition()
          .duration(duration)
          .delay(duration * 4)
            .attr("height", function (d) {
              return y.scale(d.y0) - y.scale(d[keys.y]) || height - y.scale(d[keys.y]);
            })
            .attr("y", function (d) { return y.scale(d[keys.y]); })
    ;

    // ENTER
    // Create new elements as needed.
    bar.enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x.scale(d[keys.x]) - barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", function (d) { return y.scale(0); })
      .attr("height", 0)
      .style("fill", function (d) { return d[keys.color] || ''; })
      .transition()
      .duration(duration)
        // Bring bars in one by one
        // .delay(function (d, i) { return i * 0.1 * duration * 2; })
        .attr("height", function (d) {
          return y.scale(d.y0) - y.scale(d[keys.y]) || height - y.scale(d[keys.y]);
        })
        .attr("y", function (d) { return y.scale(d[keys.y]); })
        .attr("stroke-width", strokeWidth);

    // EXIT
    // Remove old elements as needed.
    bar.exit()
      .transition()
      .duration(duration)
      .attr("y", height)
      .attr("height", 0)
      .remove();
  };

  getBarWidth = function (scale, data, keys, dimensions, xDomainInfo) {

    // If aggWindow is passed, use it
    if (xDomainInfo && xDomainInfo.aggWindow) {
      return scale(xDomainInfo.aggWindow) - scale(0);
    }

    else if (data.length === 0) {
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


  addInteractionToRects = function (svg, dimensions, xy, keys, labels, duration) {
    var height = Graph.prototype._getHeight(dimensions),
        fg = svg.select('#feature-group');

    var cb = function (d) {
      removeAllSelection();
      d3.select(this).attr('class', 'selected bar');
      var g = fg.append('g').attr('class', 'interaction-group');


      var text = Math.round(d[keys.y] * 100) / 100 + ' ' + labels.y;
      text = keys.category !== undefined
        ? text + ' ' + d[keys.category]
        : text;

      var t  = g.append('text').text(text);

      var tHeight = t.node().getBBox().height,
          tWidth = t.node().getBBox().width;

      t.attr('x', xy.x.scale(d[keys.x]) + 5)
        .attr('y', xy.y.scale(d.y1 || d[keys.y]) + tHeight);

      g.append('rect')
        .attr('class', 'tooltip-background')
        .attr('x', xy.x.scale(d[keys.x]))
        .attr('y', xy.y.scale(d.y1 || d[keys.y]))
        .attr('width', tWidth + 10)
        .attr('height', tHeight + 5);

      t.node().parentNode.appendChild(t.node());
    };

    var removeAllSelection = function () {
      fg.selectAll('.bar').attr('class', 'bar');
      fg.select('.interaction-group').remove();
    };

    fg.selectAll('.bar').on('click', cb);
    fg.selectAll('.bar').on('mousemove', cb);
    fg.selectAll('.bar').on('mouseout', function () {
      removeAllSelection();
    });
  };

  createXGraph = function (svg, dimensions, labels, options) {
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

  drawPath = function (svg, pathFn, data, duration, path, fill) {
    if (!path) {
      var fg = svg.select('g').select('#feature-group');
      // bring to front
      fg.node().parentNode.appendChild(fg.node());
      path = fg.append("svg:path")
        .attr("class", "line");
    }
    path.datum(data)
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        // Prevent returning invalid values for d
        var p = pathFn(d) || "M0, 0";
        return p;
      })
      .style('fill', fill);
    return path;
  };

  addInteractionToPath = function (svg, dimensions, data, keys, labels, path, xy, duration) {
    var bisect = d3.bisector(function (d) { return d[keys.x]; }).right,
        height = Graph.prototype._getHeight(dimensions),
        fg = svg.select('#feature-group');

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

      g.append('text')
        .text(Math.round(value * 100) / 100 + ' ' + labels.y)
        .attr('class', 'graph-tooltip-y')
        .attr('x', 5)
        .attr('y', y2 - 5);
      g.append('text')
        .text(xText + ' ' + labels.x)
        .attr('class', 'graph-tooltip-x')
        .attr('x', x2 + 5)
        .attr('y', height - 5);
    };

    svg.select('#listeners').on('click', cb);
    svg.select('#listeners').on('mousemove', cb);
    svg.select('#listeners').on('mouseout', function () {
      fg.select('.interaction-group').remove();
    });

  };

  /**
   * Draws or updates graph axis labels.
   * @param  {d3 selection} svg
   * @param  {object}       dimensions
   * @param  {string}       (optional) label, if undefined uupdates current.
   * @param  {boolean}      draw on y axis, else x-axis.
   */
  drawLabel = function (svg, dimensions, label, y) {
    var width = Graph.prototype._getWidth(dimensions),
        height = Graph.prototype._getHeight(dimensions),
        mv,
        // For some reason the x label needs to move a little bit more than
        // expected and the y label a little bit less.
        PIXEL_CORRECTION = 2,
        el = svg.select(y ? '#ylabel': '#xlabel');
    if (!el.empty()) {
      if (label) {
        el.text(label);
      }
      mv = y
        ? 0.5 * el.node().getBBox().height + PIXEL_CORRECTION
        : - 0.5 * el.node().getBBox().height + PIXEL_CORRECTION;
      el.attr('dy', mv);
   }
    else {
      el = svg.append("text")
        .attr('class', 'graph-text graph-label')
        .style("text-anchor", "middle")
        .text(label);
      mv = y
        ? 0.5 * el.node().getBBox().height + PIXEL_CORRECTION
        : - 0.5 * el.node().getBBox().height + PIXEL_CORRECTION;
      el.attr('dy', mv);
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
    }
  };

  drawAxes = function (svg, axis, dimensions, y, duration) {
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
  };

  createDonut = function (dimensions) {
    var donutHeight = Graph.prototype._getHeight(dimensions);
    dimensions.r = donutHeight / 2;
    var pie = createPie(dimensions),
    arc = createArc(dimensions);
    return {
      dimensions: dimensions,
      arc: arc,
      pie: pie
    };
  };

  createPie = function (dimensions) {
    return d3.layout.pie()
      .value(function (d) {
          return d.data;
        })
      // Sorting messes with the transition
      .sort(null);
  };

  createArc = function (dimensions) {
    var ARC_INNER_RADIUS = 0.7;
    return d3.svg.arc()
      .innerRadius(dimensions.r * ARC_INNER_RADIUS)
      .outerRadius(dimensions.r);
  };

  drawPie = function (svg, dimensions, donut, data) {
    var width = Graph.prototype._getWidth(dimensions),
    donutHeight = Graph.prototype._getHeight(dimensions),
    pie = donut.pie,
    arc = donut.arc;

    // Store the displayed angles in _current.
    // Then, interpolate from _current to the new angles.
    // During the transition, _current is updated in-place by d3.interpolate.
    function arcTween(a) {
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function (t) {
        return arc(i(t));
      };
    }

    var donutArcs = svg.datum(data).selectAll("path").data(pie);

    donutArcs
      .transition()
      .duration(Graph.prototype.transTime)
      .attrTween("d", arcTween); // redraw the arcs

    donutArcs.enter().append("path")
      .attr("fill", function (d) {return d.data.color; })
      .attr("d", arc)
      .each(function (d) { this._current = d; }) // store the initial angles
      .attr("transform", "translate(" +
        donutHeight / 2 + ", " + donutHeight / 2 + ")");
  };

  /**
   * Takes a data array and returns an array with length one/subsetFactor of the
   * input.
   *
   * It uses modulo to remove but every subsetFactor item in the array. As such
   * the result depents on the order of the input and it does not attempt to
   * simplify in a least intrusive way as e.g. douglas-peucker would. This is
   * probably faster though, which is the whole point.
   *
   * @param  {array}  data         array of data points to subset.
   * @param  {int}    subsetFactor describing how much smaller the subset should
   *                               be.
   * @return {array}               subset of data with lenght data.length /
   *                               subsetFactor.
   */
  getDataSubset = function (data, subsetFactor) {
    return data.filter(function (item, index) {
      return index % subsetFactor === 0; // returns true for every subsetFactor
                                         // th item;
    });
  };

  return Graph;

}]);
