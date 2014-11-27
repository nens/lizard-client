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
  .factory("Graph", ["NxtD3", function (NxtD3) {

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
   */
  function Graph(element, dimensions) {
    NxtD3.call(this, element, dimensions);
    this._svg = this._createDrawingArea();
  }

  Graph.prototype = Object.create(NxtD3.prototype, {

    constructor: Graph,

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
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {object} data   Currently supports the format:
     *                        [
     *                          [value, value],
     *                          ...,
     *                        ]
     * @param {object} keys   Mapping between x and y values of data object:
     *                        example: {x: 0, y: 1}
     * @param {object} labels Object {x: 'x label', y: 'y label'} will be
     *                        mapped to axis labels of the graph
     * @param {boolean} temporal to draw an time axis or not
     * @description           Draws a line, if necessary sets up the graph,
     *                        if necessary modifies domain and redraws axis,
     *                        and draws the line according to the data object.
     *                        Currently only a linear scale on the x-axis is supported.
     */
    drawLine: {
      value: function (data, keys, labels, temporal) {
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
          this._xy = this._createXYGraph(data, keys, labels, temporal ? options: undefined);
        } else {
          this._xy = rescale(this._svg, this.dimensions, this._xy, data, keys);
        }
        var line = this._createLine(this._xy, keys);
        this._path = drawPath(this._svg, line, data, this.transTime, this._path);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
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
          this._xy = this._createXYGraph(data, keys, labels, options);
        } else {
          this._xy = rescale(this._svg, this.dimensions, this._xy, data, keys, {y: 0});
          drawLabel(this._svg, this.dimensions, labels.y, true);
        }
        drawVerticalRects(this._svg, this.dimensions, this._xy, keys, data, this.transTime);
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
        drawHorizontalRectss(this._svg, this.dimensions, this.transTime, this._x.scale, data, keys, labels);
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
        var self = this;
        angular.forEach(xy, function (value, key) {
          var y = key === 'y' ? true: false;
          xy[key] = self._createD3Objects(data, keys[key], options[key], y);
          drawAxes(self._svg, xy[key].axis, self.dimensions, y);
          drawLabel(self._svg, self.dimensions, labels[key], y);
        });
        return xy;
      }
    }
  });

  var createPie, createArc, drawPie, drawAxes, drawLabel, toRescale, drawPath, setupLineGraph, createDonut,
  getBarWidth, drawVerticalRects, drawHorizontalRectss, createXGraph, rescale;

  rescale = function (svg, dimensions, xy, data, keys, origin) {
    // Sensible limits to rescale. If the max
    // of the y values is smaller than 0.2 (or 20 %) of the max of the scale,
    // update domain of the scale and redraw the axis.
    var limits = {
      x: 1,
      y: 0.2
    },
    orientation = {
      x: 'bottom',
      y: 'left'
    };
    origin = origin || {};
    // Decide to rescale for each axis.
    angular.forEach(xy, function (value, key) {
      if (toRescale(data, keys[key], limits[key], value.maxMin)) {
        value.maxMin = Graph.prototype._maxMin(data, keys[key]);
        // Start at the lowest value in the data or at the optionally specified origin value.
        value.scale.domain([origin[key] || value.maxMin.min, value.maxMin.max]);
        value.axis = Graph.prototype._makeAxis(value.scale, {orientation: orientation[key]});
        drawAxes(svg, value.axis, dimensions, key === 'y' ? true: false, Graph.prototype.transTime);
      }
    });
    return xy;
  };

  drawHorizontalRectss = function (svg, dimensions, duration, scale, data, keys, labels) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions);
    // Create a start and end for each rectangle.
    var previousCumu = 0;
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
      .style("fill", function (d) { return d.color; })
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
      var labelstr = d.label.split('-'),
      label = Math.round(d[keys.x] * 100) + '% ' + labelstr[labelstr.length - 1];
      svg.select('#xlabel')
        .text(label).attr("class", 'selected');
    });

    // When the user moves the mouse away from the graph, put the original
    // label back in place.
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
        barWidth = Math.max(1, getBarWidth(xy.x.scale, data, keys, dimensions)),
        strokeWidth = barWidth === 1 ? 0 : 1,

        // Join new data with old elements, based on the x key.
        bar = svg.select('g').select('#feature-group').selectAll(".bar")
          .data(data, function (d) { return d[keys.x]; });

    // UPDATE
    // Update old elements as needed.
    bar.transition()
      .duration(duration)
      .attr("height", function (d) { return height - y.scale(d[keys.y]); })
      .attr("x", function (d) { return x.scale(d[keys.x]) - barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", function (d) { return y.scale(d[keys.y]); });
    // ENTER
    // Create new elements as needed.
    bar.enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x.scale(d[keys.x]) - barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", function (d) { return y.scale(0); })
      .attr("height", 0)
      .transition()
      .duration(duration)
      // Bring bars in one by one
      .delay(function (d, i) { return i * 0.1 * duration; })
      .attr("height", function (d) { return height - y.scale(d[keys.y]); })
      .attr("y", function (d) { return y.scale(d[keys.y]); })
      .attr("stroke-width", strokeWidth)
      ;

    // EXIT
    // Remove old elements as needed.
    bar.exit()
      .transition()
      .duration(duration)
      // Remove bars one by one
      .delay(function (d, i) { return i * 0.1 * duration; })
      .attr("y", function (d) { return y.scale(0); })
      .attr("height", 0)
      .remove();
  };

  getBarWidth = function (scale, data, keys, dimensions) {
    return (dimensions.width - dimensions.padding.left - dimensions.padding.right) / data.length;
    //return scale(data[1][keys.x]) - scale(data[0][keys.x]);
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

  drawPath = function (svg, line, data, duration, path) {
    if (!path) {
      var fg = svg.select('g').select('#feature-group');
      // bring to front
      fg.node().parentNode.appendChild(fg.node());
      path = fg.append("svg:path")
        .attr("class", "line")
        .style("stroke-width", 3);
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

  drawLabel = function (svg, dimensions, label, y) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions),
    // Correct 2 pixels to make sure the labels fall
    // completely within the svg
    PIXEL_CORRECTION = 2;
    var el = svg.select(y ? '#ylabel': '#xlabel');
    if (!el.empty()) { el.text(label); }
    else {
      el = svg.append("text")
        .attr('class', 'graph-text graph-label')
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
        el.attr('dy', - PIXEL_CORRECTION);
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

  return Graph;

}]);
