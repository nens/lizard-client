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

  var createCanvas, createElementForAxis, resizeCanvas, _createDrawingArea;

  function NxtD3(element, dimensions) {
    this.dimensions = angular.copy(dimensions);
    this._svg = createCanvas(element, this.dimensions);
  }

  NxtD3.prototype = {

    constructor: NxtD3,

    _transTime: 300,
    _localeFormatter: {
      'nl_NL': d3.locale({
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["€", ""],
        "dateTime": "%a %b %e %X %Y",
        "date": "%d-%m-%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
        "shortDays": ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"],
        "months": ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"],
        "shortMonths": ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
      })
    },

    resize: function (dimensions) {
      this.dimensions = angular.copy(dimensions);
      this._svg = resizeCanvas(this._svg, this.dimensions);
      this._svg = this._createDrawingArea(this._svg, this.dimensions);
    },
    _createDrawingArea: function (svg, dimensions) {
      var width = NxtD3.prototype._getWidth(dimensions),
      height = NxtD3.prototype._getHeight(dimensions);
      // Add clippath to limit the drawing area to inside the graph
      // See: http://bost.ocks.org/mike/path/
      var clip = svg.select('g').select("defs");
      if (!clip[0][0]) {
        svg.select('g').append('defs').append("svg:clipPath")
          .attr("id", "clip")
          .append("svg:rect")
          .attr("id", "clip-rect")
          .attr("x", "0")
          .attr("y", "0")
          .attr("width", width)
          .attr("height", height);
      }
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
      if (scale.domain()[0] instanceof Date) {
        var tickFormat = this._localeFormatter['nl_NL'].timeFormat.multi([
              ["%H:%M", function(d) { return d.getMinutes(); }],
              ["%H:%M", function(d) { return d.getHours(); }],
              ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
              ["%b %d", function(d) { return d.getDate() != 1; }],
              ["%B", function(d) { return d.getMonth(); }],
              ["%Y", function() { return true; }]
            ]);
        axis.tickFormat(tickFormat);
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
    _createLine: function (xy, keys) {
      return d3.svg.line().interpolate('basis')
        .y(function (d) {
          return xy.y.scale(d[keys.y]);
        })
        .x(function (d) {
          return xy.x.scale(d[keys.x]);
        })
        .defined(function (d) { return !isNaN(parseFloat(d[keys.y])); });
    },
    _drawNow: function (now, scale) {
      var height = this._getHeight(this.dimensions);
      var x = scale(now);

      var nowIndicator = this._svg.select('g').select('#feature-group').select('.now-indicator');

      if (!nowIndicator[0][0]) {
        nowIndicator = this._svg.select('g').select('#feature-group').append('line')
          .attr('class', 'now-indicator')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', height)
          .attr('y2', 0);
      }
      nowIndicator.transition().duration(this._transTime)
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', height)
        .attr('y2', 0);
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
        .attr("transform", "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")")
        // Add rect element to attach listeners
        .append('rect')
          .attr('id', 'listeners')
          .attr('width', width)
          .attr('height', height);
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
