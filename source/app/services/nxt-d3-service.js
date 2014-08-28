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
app.factory("NxtD3Service", [ function () {

  var NxtD3 = {}, createElementForAxis;

  NxtD3.prototype = {

    _transTime: 300,
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
    _createCanvas: function (element, dimensions) {
      var width = this._getWidth(dimensions),
      height = this._getHeight(dimensions),
      svg = d3.select(element);
      svg.attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .style("margin-top", dimensions.padding.top)
        .append("g")
          .attr("transform", "translate(" + dimensions.padding.left + ", 0)")
          .append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "plot-temporal");
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
      if (options.type === 'time') {
        scale = d3.time.scale()
          .domain([minMax.min, minMax.max])
          .range([range.min, range.max]);
      }
      else {
        if (options.scale === "ordinal") {
          scale = d3.scale.ordinal()
            .domain(function (d) {
              return d3.set(d.properties.event_sub_type).values();
            })
            .range(options.colors[8]);
        }
        else if (options.scale === "linear") {
          scale = d3.scale.linear()
            .domain([minMax.min, minMax.max])
            .range([range.min, range.max]);
        }
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
    }
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
