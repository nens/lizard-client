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
app.factory("Graph", ["NxtD3Service", function (NxtD3Service) {

  // D3 components
  var pie,
  arc,
  line,

  // Interaction functions
  clicked,
  hoovered,

  // Graph elements
  donutArcs,
  path;

  /**
   * @constructor
   * @memberOf app.Graph
   *
   * @param {object} element svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {object} interaction  optional object containing callback functions
   *  for click and hover interaction.
   */
  function Graph(element, dimensions, data, interaction) {
    this.dimensions = angular.copy(dimensions);
    this.svg = this._createCanvas(element, this.dimensions);
  }

  Graph.prototype = Object.create(NxtD3Service.prototype, {

    constructor: Graph,

    createDonut: {
      value: function () {
        var donutHeight = getDonutHeight(this.dimensions);
        this.dimensions.r = donutHeight / 2;
        pie = createPie(this.dimensions);
        arc = createArc(this.dimensions);
      }
    },
    drawDonut: {
      value: function (data) {
        _drawDonut(this.svg, this.dimensions, data, pie, arc);
      }
    },
    setupXYGraph: {
      value: function (data, keys, labels) {
        var optionsX = {
            scale: 'linear',
            orientation: 'bottom'
          },
        optionsY = {
            scale: 'linear',
            orientation: 'left'
          };
        this.x = createD3Objects(this.svg, this.dimensions, data, keys.x, optionsX, false);
        this.y = createD3Objects(this.svg, this.dimensions, data, keys.y, optionsY, true);
        addLabel(this.svg, this.dimensions, labels.x, false);
        addLabel(this.svg, this.dimensions, labels.y, true);
      }
    },
    setupLineGraph: {
      value: function (keys) {
        line = this._createLine(this.x, this.y, keys);
      }
    },
    drawLine: {
      value: function (data, keys) {
        if (toRescale(data, keys.x, 1, this.x.maxMin)) {
          this.x.scale.domain([0, this._maxMin(data, keys.x).max]);
          this.x.axis = this._makeAxis(this.x.scale, {orientation: 'bottom'});
          drawAxes(this.svg, this.x.axis, this.dimensions, false, this._transTime);
          line = this._createLine(this.x, this.y, keys);
        }
        if (toRescale(data, keys.y, 0.1, this.y.maxMin)) {
          this.y.scale.domain([0, this._maxMin(data, keys.y).max]);
          this.y.axis = this._makeAxis(this.y.scale, {orientation: 'left'});
          drawAxes(this.svg, this.y.axis, this.dimensions, true, this._transTime);
          line = this._createLine(this.x, this.y, keys);
        }
        path = _drawLine(this.svg, line, data, this._transTime, path);
      }
    }

  });

  var createPie, createArc, _drawDonut, getDonutHeight, drawAxes, addLabel,
  createD3Objects, toRescale, _drawLine;

  _drawLine = function (svg, line, data, duration, path) {
    if (!path) {
      path = svg.select('g').append("svg:path")
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
