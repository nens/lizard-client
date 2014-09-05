/**
 * @name Graph
 * @class app.Graph
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
 * Everything in the graphs is animated according to NxtD3.transTime.
 */
app.factory("Graph", ["NxtD3", function (NxtD3) {

  /**
   * @constructor
   * @memberOf app.Graph
   *
   * @param {object} element    svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   */
  function Graph(element, dimensions) {
    NxtD3.call(this, element, dimensions);
    this._svg = this._createDrawingArea(this._svg, this.dimensions);
  }

  Graph.prototype = Object.create(NxtD3.prototype, {

    constructor: Graph,

    /**
     * @function
     * @memberOf app.Graph
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
        _drawDonut(this._svg, this.dimensions, this._donut, data);
      }
    },

    /**
     * @function
     * @memberOf app.Graph
     * @param {object} data   Currently supports the format:
     *                        [
     *                          [value, value],
     *                          ...,
     *                        ]
     * @param {object} keys   Mapping between x and y values of data object:
     *                        example: {x: 0, y: 1}
     * @param {object} labels Object {x: 'x label', y: 'y label'} will be
     *                        mapped to axis labels of the graph
     * @description           Draws a line, if necessary sets up the graph,
     *                        if necessary modifies domain and redraws axis,
     *                        and draws the line according to the data object.
     *                        Currently only a linear scale on the x-axis is supported.
     */
    drawLine: {
      value: function (data, keys, labels) {
        if (!this.xy) {
          this.xy = createXYGraph(this._svg, this.dimensions, data, keys, labels);
        } else {
          this.xy = rescale(this._svg, this.dimensions, this.xy, data, keys);
        }
        this._line = this._createLine(this.xy, keys);
        this._path = _drawLine(this._svg, this._line, data, this._transTime, this._path);
      }
    },

    /**
     * @function
     * @memberOf app.Graph
     * @param {object} data   Currently supports the format:
     *                        [
     *                          [value, value],
     *                          ...,
     *                        ]
     * @param {object} keys   Mapping between x and y values of data object:
     *                        example: {x: 0, y: 1}
     * @param {object} labels Object {x: 'x label', y: 'y label'} will be
     *                        mapped to axis labels of the graph
     * @description           Draws a barchart, if necessary sets up the graph,
     *                        if necessary modifies domain and redraws axis,
     *                        and draws the line according to the data object.
     *                        Currently only a time scale on the x-axis is supported.
     */
    drawBars: {
      value: function (data, keys, labels) {
        if (!this.xy) {
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
          this.xy = createXYGraph(this._svg, this.dimensions, data, keys, labels, options);
          this.xy.barWidth = getBarWidth(this.xy.x, data, keys);
        } else {
          this.xy = rescale(this._svg, this.dimensions, this.xy, data, keys);
          this.xy.barWidth = getBarWidth(this.xy.x, data, keys);
        }
        drawVerticalRects(this._svg, this.dimensions, this.xy, keys, data, this._transTime);
      }
    },

    /**
     * @function
     * @memberOf app.Graph
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
        // normalize data
        var total = d3.sum(data, function (d) {
          return Number(d[keys.x]);
        });
        angular.forEach(data, function (value, key) {
          value[keys.x] = value[keys.x] / total;
        });
        if (!this.x) {
          this.x = createXGraph(this._svg, this.dimensions, labels);
        }
        drawHorizontalRectss(this._svg, this.dimensions, this._transTime, this.x.scale, data, keys, labels);
      }
    },

    /**
     * @function
     * @memberOf app.Graph
     * @param {function} callback
     * @description      Sets a listener on the drawing rectangle
     *                   and on mousemove calls the callback with
     *                   the current position on the drawing area.
     */
    followMouse: {
      value: function (callback) {
        var self = this;
        var el = this._svg.select('g').select('#listeners');
        el.on('mousemove', function () {
          var pos = self.xy.x.scale.invert(d3.mouse(this)[0]);
          callback(pos);
        });
      }
    },

    /**
     * @function
     * @memberOf app.Graph
     * @param {function} callback
     * @description      Sets a listener on the drawing rectangle
     *                   and on mouseout calls the callback.
     */
    mouseExit: {
      value: function (callback) {
        var self = this;
        var el = this._svg.select('g').select('#listeners');
        el.on('mouseout', function () {
          callback();
        });
      }
    },

    /**
     * @function
     * @memberOf app.Graph
     * @param {int}    draw   Timestamp in ms from epoch
     * @description           draws the now according the
     *                        current active scale.
     */
    drawNow: {
      value: function (now) {
        this._drawNow(now, this.xy.x.scale);
      }
    }
  });

  var createPie, createArc, _drawDonut, getDonutHeight, drawAxes, addLabel,
  createD3Objects, toRescale, _drawLine, createXYGraph, setupLineGraph, createDonut,
  getBarWidth, drawVerticalRects, drawHorizontalRectss, createXGraph, rescale;

  rescale = function (svg, dimensions, xy, data, keys) {
    var limits = {
      x: 1,
      y: 0.1
    },
    orientation = {
      x: 'bottom',
      y: 'left'
    };
    angular.forEach(xy, function (value, key) {
      if (toRescale(data, keys[key], limits[key], value.maxMin)) {
        value.maxMin = Graph.prototype._maxMin(data, keys[key])
        value.scale.domain([0, value.maxMin.max]);
        value.axis = Graph.prototype._makeAxis(value.scale, {orientation: orientation[key]});
        drawAxes(svg, value.axis, dimensions, key === 'y' ? true: false, Graph.prototype._transTime);
      }
    });
    return xy;
  };

  drawHorizontalRectss = function (svg, dimensions, duration, scale, data, keys, labels) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions);
    var previousCumu = 0;
    angular.forEach(data, function (value) {
      value.start = previousCumu;
      previousCumu += value.data;
    });
    var total = 1;

    // Join new data with old elements, based on the timestamp.
    var rects = svg.select('g').select('#feature-group').selectAll("rect")
      .data(data, function (d) { return d[keys.y]; });

    // UPDATE
    // Update old elements as needed.
    rects.transition()
      .duration(duration)
      .attr("x", function (d) { return scale(d.start); })
      .attr('width', function (d) { return scale(total - d.start); });
    // ENTER
    // Create new elements as needed.
    rects.enter().append("rect")
      .style("fill", function (d) { return d.color; })
      .attr("x", function (d) { return scale(d.start); })
      .attr("y", 0)
      .attr("height", height)
      .transition()
      .duration(duration)
      .attr('width', function (d) { return scale(total - d.start); });
    // EXIT
    // Remove old elements as needed.
    rects.exit()
      .transition()
      .duration(duration)
      .attr("x", function (d) { return scale(total); })
      .attr('width', 0)
      .remove();

    rects.on('mousemove', function (d) {
      var labelstr = d.label.split('-'),
      label = Math.round(d.data * 100) + '% ' + labelstr[labelstr.length - 1];
      svg.select('#xlabel')
        .text(label).attr("class", 'selected');
    });

    rects.on('mouseout', function (d) {
      svg.select('#xlabel')
        .text(labels.x)
        .classed({"selected": false});
    });

  };

  drawVerticalRects = function (svg, dimensions, xy, keys, data, duration) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions),
    x = xy.x,
    y = xy.y,
    barWidth =  xy.barWidth,

    // Join new data with old elements, based on the timestamp.
    bar = svg.select('g').select('#feature-group').selectAll(".bar")
      .data(data, function (d) { return d[keys.x]; });

    // UPDATE
    // Update old elements as needed.
    bar.transition()
      .duration(duration)
      .attr("height", function (d) { return height - y.scale(d[keys.y]); })
      .attr("x", function (d) { return x.scale(d[keys.x]) - 0.5 * barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", function (d) { return y.scale(d[keys.y]); });
    // ENTER
    // Create new elements as needed.
    bar.enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x.scale(d[keys.x]) - 0.5 * barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", function (d) { return y.scale(0); })
      .attr("height", 0)
      .transition()
      .duration(duration)
      .delay(function (d, i) { return i * 0.1 * duration; })
      .attr("height", function (d) { return height - y.scale(d[keys.y]); })
      .attr("y", function (d) { return y.scale(d[keys.y]); });

    // EXIT
    // Remove old elements as needed.
    bar.exit()
    .remove();
  };

  getBarWidth = function (x, data, keys) {
    return x.scale(data[1][keys.x]) - x.scale(data[0][keys.x]);
  };

  createDonut = function (dimensions) {
    var donutHeight = getDonutHeight(dimensions);
    dimensions.r = donutHeight / 2;
    var pie = createPie(dimensions),
    arc = createArc(dimensions);
    return {
      dimensions: dimensions,
      arc: arc,
      pie: pie
    };
  };

  createXGraph = function (svg, dimensions, labels) {
    var x = {};
    var options = {
      scale: 'linear',
      orientation: 'bottom'
    },
    width = Graph.prototype._getWidth(dimensions),
    range = {min: 0, max: width},
    // Axis should run from zero to 100%
    domain = {min: 0, max: 1};
    x.scale = Graph.prototype._makeScale(domain, range, {scale: 'linear'}),
    x.axis = Graph.prototype._makeAxis(x.scale, {orientation: 'bottom'});
    drawAxes(svg, x.axis, dimensions, false);
    addLabel(svg, dimensions, labels.x, false);
    return x;
  };

  createXYGraph = function (svg, dimensions, data, keys, labels, options) {
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
    var x = createD3Objects(svg, dimensions, data, keys.x, options.x, false),
    y = createD3Objects(svg, dimensions, data, keys.y, options.y, true);
    addLabel(svg, dimensions, labels.x, false);
    addLabel(svg, dimensions, labels.y, true);
    return {
      x: x,
      y: y
    };
  };

  _drawLine = function (svg, line, data, duration, path) {
    if (!path) {
      path = svg.select('g').select('#feature-group').append("svg:path")
        .attr("class", "line");
    }
    path.datum(data)
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        // Prevent returning invalid values for d
        return line(d) || "M0, 0";
      });
    return path;
  };

  toRescale = function (data, key, limit, old) {
    var rescale = false,
    n = Graph.prototype._maxMin(data, key);
    if (n.max > old.max
      || n.max < (limit * old.max)
      || n.min !== old.min) {
      rescale = true;
    }
    return rescale;
  };

  createD3Objects = function (svg, dimensions, data, key, options, y) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions),
    d3Objects = {},
    domain = y ? {max: 0, min: height}: {min: 0, max: width};

    d3Objects.maxMin = Graph.prototype._maxMin(data, key);
    d3Objects.scale = Graph.prototype._makeScale(d3Objects.maxMin, domain, options);
    d3Objects.axis = Graph.prototype._makeAxis(d3Objects.scale, options);
    drawAxes(svg, d3Objects.axis, dimensions, y);
    return d3Objects;
  };

  addLabel = function (svg, dimensions, label, y) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions),
    PIXEL_CORRECTION = 1,
    el = svg.append("text")
      .attr('class', 'graph-text')
      .style("text-anchor", "middle")
      .text(label);
    if (y) {
      el.attr('id', 'ylabel')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0)
        .attr('x', 0 - height / 2);
      el.attr('dy', 0.5 * el.node().getBBox().height + PIXEL_CORRECTION);
    } else {
      el.attr('id', 'xlabel')
        .attr('x', dimensions.padding.left + width / 2)
        .attr('y', dimensions.height - PIXEL_CORRECTION);
      el.attr('dy', - 0.5 * el.node().getBBox().height);
    }
  };

  drawAxes = function (svg, axis, dimensions, y, duration) {
    Graph.prototype._drawAxes(svg, axis, dimensions, y, duration);
    var axisEl;
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
          .attr("transform", "rotate(-45)");
    }
  };

  createPie = function (dimensions) {
    return d3.layout.pie()
      .value(function (d) {
          return d.data;
        })
      .sort(null);
  };

  createArc = function (dimensions) {
    var ARC_INNER_RADIUS = 0.4;
    return d3.svg.arc()
      .innerRadius(dimensions.r * ARC_INNER_RADIUS)
      .outerRadius(dimensions.r);
  };

  _drawDonut = function (svg, dimensions, donut, data) {
    var width = Graph.prototype._getWidth(dimensions),
    donutHeight = getDonutHeight(dimensions),
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
      .duration(Graph.prototype._transTime)
      .attrTween("d", arcTween); // redraw the arcs

    donutArcs.enter().append("path")
      .attr("fill", function (d) {return d.data.color; })
      .attr("d", arc)
      .each(function (d) { this._current = d; }) // store the initial angles
      .attr("transform", "translate(" +
        donutHeight / 2 + ", " + donutHeight / 2 + ")");
  };

  getDonutHeight = function (dimensions) {
    return dimensions.height - dimensions.padding.top;
  };

  return Graph;

}]);
