/**
 * @name Graph
 * @class app.Graph
 * @memberOf app
 *
 * @summary Service to create and update a graph
 *
 * @description Inject "Graph" and call new graph(<args>) to create a
 * graph. Currently the graph supports lines, bars and donut. The user may interact with
 * the graph through click and hover functions.
 *
 * Everything in the graphs is animated for 500 milliseconds.
 */
app.factory("Graph", ["NxtD3", function (NxtD3) {

  // Interaction functions
  var clicked,
  hoovered;

  /**
   * @constructor
   * @memberOf app.Graph
   *
   * @param {object} element svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   */
  function Graph(element, dimensions, data) {
    NxtD3.call(this, element, dimensions);
    this.svg = this.createDrawingArea(this.svg, this.dimensions);
  }

  Graph.prototype = Object.create(NxtD3.prototype, {

    constructor: Graph,

    drawDonut: {
      value: function (data) {
        if (!this.dimensions.r || this._arc || this._pie) {
          var donut = createDonut(this.dimensions);
          this.dimensions = donut.dimensions;
          this._pie = donut.pie;
          this._arc = donut.arc;
        }
        _drawDonut(this.svg, this.dimensions, data, this._pie, this._arc);
      }
    },
    drawLine: {
      value: function (data, keys, labels) {
        if (!this.x || !this.y) {
          var yx = setupXYGraph(this.svg, this.dimensions, data, keys, labels);
          this.x = yx.x;
          this.y = yx.y;
        }
        if (toRescale(data, keys.x, 1, this.x.maxMin)) {
          this.x.scale.domain([0, this._maxMin(data, keys.x).max]);
          this.x.axis = this._makeAxis(this.x.scale, {orientation: 'bottom'});
          drawAxes(this.svg, this.x.axis, this.dimensions, false, this._transTime);
          this._line = this._createLine(this.x, this.y, keys);
        }
        if (toRescale(data, keys.y, 0.1, this.y.maxMin)) {
          this.y.scale.domain([0, this._maxMin(data, keys.y).max]);
          this.y.axis = this._makeAxis(this.y.scale, {orientation: 'left'});
          drawAxes(this.svg, this.y.axis, this.dimensions, true, this._transTime);
          this._line = this._createLine(this.x, this.y, keys);
        }
        if (!this.line) { this._line = this._createLine(this.x, this.y, keys); }
        this._path = _drawLine(this.svg, this._line, data, this._transTime, this._path);
      }
    },
    drawBars: {
      value: function (data, keys, labels) {
        if (!this.x || !this.y) {
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
          var yx = setupXYGraph(this.svg, this.dimensions, data, keys, labels, options);
          this.x = yx.x;
          this.y = yx.y;
          this.x.barWidth = getBarWidth(this.x, data, keys);
        }
        if (toRescale(data, keys.x, 1, this.x.maxMin)) {
          this.x.scale.domain([0, this._maxMin(data, keys.x).max]);
          this.x.axis = this._makeAxis(this.x.scale, {orientation: 'bottom'});
          drawAxes(this.svg, this.x.axis, this.dimensions, false, this._transTime);
          this.x.barWidth = getBarWidth(this.x, data, keys);
        }
        if (toRescale(data, keys.y, 0.1, this.y.maxMin)) {
          this.y.scale.domain([0, this._maxMin(data, keys.y).max]);
          this.y.axis = this._makeAxis(this.y.scale, {orientation: 'left'});
          drawAxes(this.svg, this.y.axis, this.dimensions, true, this._transTime);
        }
        _drawBars(this.svg, this.dimensions, this.x, this.y, keys, data, this._transTime);
      }
    },
    drawHorizontalStack: {
      value: function (data, keys, labels) {
        if (!this.x) {
          setupXGraph(this.svg, this.dimensions, labels);
        }

        var total = d3.sum(data, function (d) {
          return Number(d[keys.x]);
        });
        this.x = {max: total, min: 0};
        var width = this._getWidth(this.dimensions),
        range = {min: 0, max: width};
        this.x.scale = this._makeScale(this.x, range, {scale: 'linear'});

        _drawHorizontalStacks(this.svg, this.dimensions, this._transTime, this.x.scale, data, keys, total, labels);
      }
    },
    followMouse: {
      value: function (callback) {
        var self = this;
        var el = this.svg.select('g').select('#listeners');
        el.on('mousemove', function () {
          var pos = self.x.scale.invert(d3.mouse(this)[0]);
          callback(pos);
        });
      }
    },
    mouseExit: {
      value: function (callback) {
        var self = this;
        var el = this.svg.select('g').select('#listeners');
        el.on('mouseout', function () {
          callback();
        });
      }
    }
  });

  var createPie, createArc, _drawDonut, getDonutHeight, drawAxes, addLabel,
  createD3Objects, toRescale, _drawLine, setupXYGraph, setupLineGraph, createDonut,
  getBarWidth, _drawBars, _drawHorizontalStacks, setupXGraph;

  _drawHorizontalStacks = function (svg, dimensions, duration, scale, data, keys, total, labels) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions);
    var previousCumu = 0;
    angular.forEach(data, function (value) {
      value.start = previousCumu;
      previousCumu += value.data;
    });

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
      var labels = d.label.split('-'),
      label = labels[labels.length - 1];
      label = Math.round(d.data / total * 100) + '% ' + label;
      svg.select('#xlabel')
        .text(label).attr("class", 'selected');
    });

    rects.on('mouseout', function (d) {
      svg.select('#xlabel')
        .text(labels.x).classed({"selected": false});
    });

  };

  _drawBars = function (svg, dimensions, x, y, keys, data, duration) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions),

    // Join new data with old elements, based on the timestamp.
    bar = svg.select('g').select('#feature-group').selectAll(".bar")
      .data(data, function (d) { return d[keys.x]; });

    // UPDATE
    // Update old elements as needed.
    bar.transition()
      .duration(duration)
      .attr("height", function (d) { return height - y.scale(d[keys.y]); })
      .attr("x", function (d) { return x.scale(d[keys.x]) - 0.5 * x.barWidth; })
      .attr('width', function (d) { return x.barWidth; })
      .attr("y", function (d) { return y.scale(d[keys.y]); });
    // ENTER
    // Create new elements as needed.
    bar.enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x.scale(d[keys.x]) - 0.5 * x.barWidth; })
      .attr('width', function (d) { return x.barWidth; })
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

  setupXGraph = function (svg, dimensions, labels) {
    var options = {
      scale: 'linear',
      orientation: 'bottom'
    };
    var width = Graph.prototype._getWidth(dimensions),
    range = {min: 0, max: width},
    // Axis should run from zero to 100%
    domain = {min: 0, max: 100},
    axisScale = Graph.prototype._makeScale(domain, range, {scale: 'linear'}),
    axis = Graph.prototype._makeAxis(axisScale, {orientation: 'bottom'});
    drawAxes(svg, axis, dimensions, false);
    addLabel(svg, dimensions, labels.x, false);
  };

  setupXYGraph = function (svg, dimensions, data, keys, labels, options) {
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

  _drawDonut = function (svg, dimensions, data, pie, arc) {
    var width = Graph.prototype._getWidth(dimensions),
    donutHeight = getDonutHeight(dimensions);

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
