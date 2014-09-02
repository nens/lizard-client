/**
 * @name NxtD3Service
 * @class app.NxtD3Service
 * @memberOf app
 *
 * @summary Service to create and update common d3 elements.
 *
 * @description Inject "NxtD3Service" and either extend this service
 * by calling: Child.prototype = Object.create(NxtD3Service.prototype) as
 * in the higher level graph and timeline services or use these methods
 * directly by calling NxtD3Service.<method>(<args>).
 */
app.factory("NxtD3", [ function () {

  var createCanvas, createElementForAxis, resizeCanvas, createDrawingArea;

  function NxtD3(element, dimensions) {
    this.dimensions = angular.copy(dimensions);
    this.svg = createCanvas(element, this.dimensions);
  }

  NxtD3.prototype = {

    _transTime: 300,

    resize: function (dimensions) {
      this.dimensions = angular.copy(dimensions);
      this.svg = resizeCanvas(this.svg, this.dimensions);
      this.svg = this.createDrawingArea(this.svg, this.dimensions);
    },
    createDrawingArea: function (svg, dimensions) {
      var width = NxtD3.prototype._getWidth(dimensions),
      height = NxtD3.prototype._getHeight(dimensions);
      // Add clippath to limit the drawing area to inside the graph
      // See: http://bost.ocks.org/mike/path/
      var clip = svg.select('g').select("defs");
      if (!clip[0][0]) {
        svg.select('g').append('defs').append("svg:clipPath");
      }
      svg.select('g').select("defs").select("clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", width)
        .attr("height", height);
      // Put the data in this group
      var g = svg.select('g').select('g');
      if (!g[0][0]) {
        g = svg.select('g').append('g');
      }
      g.attr("clip-path", "url(#clip)")
        .attr('id', 'feature-group');
      return svg;
    },
    /**
     * Returns a max min object for a data object or array of arrays.
     */
    _maxMin: function (data, key) {
      var max = d3.max(data, function (d) {
              return Number(d[key]);
            });

      var min = d3.min(data, function (d) {
              return Number(d[key]);
            });
      return {
        max: max,
        min: min
      };
    },

    /**
     * Returns a d3 scale.
     */
    _makeScale: function (minMax, range, options) {
      // Instantiate a d3 scale based on min max and
      // width and height of plot
      var scale;
      if (options.scale === 'time') {
        scale = d3.time.scale()
          .domain([new Date(minMax.min), new Date(minMax.max)])
          .range([range.min, range.max]);
      } else if (options.scale === "ordinal") {
        scale = d3.scale.ordinal()
          .domain(function (d) {
            return d3.set(d.properties.event_sub_type).values();
          })
          .range(options.colors[8]);
      } else if (options.scale === "linear") {
        scale = d3.scale.linear()
          .domain([minMax.min, minMax.max])
          .range([range.min, range.max]);
      }
      return scale;
    },

    /**
     * Create a d3 axis based on scale.
     */
    _makeAxis: function (scale, options) {
      // Make an axis for d3 based on a scale
      var axis = d3.svg.axis()
        .scale(scale)
        .orient(options.orientation);
      if (options.ticks) {
        axis.ticks(options.ticks);
      } else {
        axis.ticks(5);
      }
      return axis;
    },

    /**
     * Draws the given axis in the given svg
     */
    _drawAxes: function (svg, axis, dimensions, y, duration) {
      var id = y ? 'yaxis': 'xaxis';
      var axisEl = svg.select('g').select('#' + id);
      if (!axisEl[0][0]) {
        axisEl = createElementForAxis(svg, id, dimensions, y);
      }
      if (duration) {
        axisEl
          .transition()
          .duration(duration)
          .call(axis);
      } else {
        axisEl
          .call(axis);
      }
    },

    /**
     * Retruns width from dimensions.
     */
    _getWidth: function (dimensions) {
      return dimensions.width -
        dimensions.padding.left -
        dimensions.padding.right;
    },

    /**
     * Returns height from dimensions.
     */
    _getHeight: function (dimensions) {
      return dimensions.height -
        dimensions.padding.top -
        dimensions.padding.bottom;
    },

    _createLine: function (x, y, keys) {
      return d3.svg.line().interpolate('basis')
        .y(function (d) {
          return y.scale(d[keys.y]);
        })
        .x(function (d) {
          return x.scale(d[keys.x]);
        })
        .defined(function (d) { return !isNaN(parseFloat(d[keys.y])); });
    }
  };


  /**
   * Creates a svg canvas for drawing,
   *
   * @param  {object} svg element to create canvas.
   * @param  {object} dimensions  object containing, width, height and an
   *                              object containing top,
   *                              bottom, left and right padding. All
   *                              values in px.
   * @return {object} svg         svg.
   */
  createCanvas = function (element, dimensions) {
    var width = NxtD3.prototype._getWidth(dimensions),
    height = NxtD3.prototype._getHeight(dimensions),
    svg = d3.select(element);
    // Create the svg as big as the dimensions
    svg.attr('width', dimensions.width)
      .attr('height', dimensions.height)
      // Create a drawing group that is shifted left side padding to the right
      .append("g")
        .attr("transform", "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")");
    return svg;
  };

  resizeCanvas = function (svg, dimensions) {
    var width = NxtD3.prototype._getWidth(dimensions),
    height = NxtD3.prototype._getHeight(dimensions);
    // Create the svg as big as the dimensions
    svg.attr('width', dimensions.width)
      .attr('height', dimensions.height)
      // Create a drawing group that is shifted left side padding to the right
      .select("g")
        .attr("transform", "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")");
    return svg;
  };

  createElementForAxis = function (svg, id, dimensions, y) {
    var className = y ? 'y axis': 'x axis',
    transform = y ? 0: NxtD3.prototype._getHeight(dimensions);
    return svg.select('g').append('g')
      .attr('class', className)
      .attr('id', id)
      .attr("transform", "translate(0 ," + transform + ")");
  };

  return NxtD3;

}]);
