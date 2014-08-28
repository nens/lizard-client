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

  var svg,

  // D3 components
  x = {},
  y = {},
  pie,
  arc,
  line,

  // Interaction functions
  clicked,
  hoovered,

  // Graph elements
  donutArcs;

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
    svg = this._createCanvas(element, this.dimensions);
    if (interaction) {
      if (interaction.clickFn) {
        // clicked = setClickFunction(xScale, this.dimensions,
        //   interaction.clickFn);
      }
      if (interaction.moveFn) {
        // brushed = setMoveFunction(xScale, interaction.brushFn);
      }
    }
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
        _drawDonut(svg, this.dimensions, data, pie, arc);
      }
    },
    setupXYGraph: {
      value: function (data, keys) {
        var width = this._getWidth(this.dimensions),
        height = this._getHeight(this.dimensions);
        x.maxMin = this._maxMin(data, keys.x);
        x.scale = this._makeScale(x.maxMin, {min: 0, max: width}, {scale: 'linear'});
        x.axis = this._makeAxis(x.scale, {orientation: 'bottom'});
        y.maxMin = this._maxMin(data, keys.y);
        y.scale = this._makeScale(y.maxMin, {min: 0, max: height}, {scale: 'linear'});
        y.axis = this._makeAxis(y.scale, {orientation: 'left'});
        drawAxes(svg, x.axis, this.dimensions, false);
        drawAxes(svg, y.axis, this.dimensions, true);

      }
    }

  });

  var createPie, createArc, _drawDonut, getDonutHeight, drawAxes;

  drawAxes = function (svg, axis, dimensions, y) {
    Graph.prototype._drawAxes(svg, axis, dimensions, y);
    var axis;
    if (y) {
      axis = d3.select('#yaxis')
        .attr("class", "y-axis y axis")
        .selectAll("text")
        .style("text-anchor", "end")
        .attr('class', 'graph-text');
    } else {
      axis = d3.select('#xaxis')
        .attr("class", "x-axis x axis")
        .selectAll("text")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
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
