'use strict';

/**
 * @name NxtD3
 * @class angular.module('lizard-nxt')
  .NxtD3
 * @memberOf app
 *
 * @summary Service to create and update common d3 elements. It is an
 * abstraction over d3 to share certain d3 operations between timeline and
 * graph.
 *
 * @description Inject "NxtD3Service" and either extend this service
 * by calling: Child.prototype = Object.create(NxtD3Service.prototype) as
 * in the higher level graph and timeline services or use these methods
 * directly by calling NxtD3Service.<method>(<args>).
 */
angular.module('lizard-nxt')
  .factory("NxtD3", ["$rootScope", "$location", function ($rootScope, $location) {

  var createCanvas, createElementForAxis, resizeCanvas, extendPathGenerator;

  /**
   * @constructor
   * @memberOf angular.module('lizard-nxt')
  .NxtD3
   *
   * @param {object} element    svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {int} xDomainStart  unix-time; start of wanted domain
   * @param {int} xDomainEnd    unix-time; end of wanted domain
   */
  function NxtD3(element, dimensions, xDomain) {
    this.dimensions = angular.copy(dimensions);
    this._xDomain = xDomain;
    this._svg = createCanvas(element, this.dimensions);
  }

  NxtD3.prototype = {

    constructor: NxtD3,

    /**
     * @attribute
     * @memberOf angular.module('lizard-nxt')
     * @description        The duration of transitions in ms. Use(d)
     *                     throughout the graphs and timeline.
     */
    transTime: 300,

    /**
     * @attribute
     * @memberOf angular.module('lizard-nxt')
     * @description The locale we are currently using. i.e. dutch if the URL \
     *              explicitly says so, english otherwise.
     */

    _locale: window.location.href.indexOf('/nl/') > -1
      ? 'nl_NL'
      : 'en_US',

    /**
     * @attribute
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     * @description        Locales. Used in the axes. Currently only Dutch
     *                     is supported (and d3's default english/US en_US).
     */
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
        "days": ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
        "shortDays": ["zo", "ma", "di", "wo", "do", "vr", "za"],
        "months": ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
        "shortMonths": ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
      }),
      'en_US': d3.locale({
        "decimal": ".",
        "thousands": ",",
        "grouping": [3],
        "currency": ["$", ""],
        "dateTime": "%a %b %e %X %Y",
        "date": "%m-%d-%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        "shortDays": ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
        "months": ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"],
        "shortMonths": ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
      })
    },

    _getLocaleFormatter: function () {
      return this._localeFormatter[this._locale];
    },


    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @description Creates or modifies a clippath and features-group
     *              to the svg. Feature-group is to draw the features
     *              in, clippath is to prevent drawing outside this
     *              area.
     * @return {object} svg with clip-area and feature-group
     */
    _createDrawingArea: function () {
      var width = this._getWidth(this.dimensions),
      height = this._getHeight(this.dimensions);
      // Add clippath to limit the drawing area to inside the graph
      // See: http://bost.ocks.org/mike/path/
      //
      // NOTE: we append the height to the clippath to prevent assocating a
      // clippath with the wrong rect element. What used to happen was: the
      // elevation graph gets clipped by the clippath of the horizontalstack.
      var clip = this._svg.select('g').select("defs");
      if (!clip[0][0]) {
        clip = this._svg.select('g').append('defs').append("svg:clipPath")
        .attr('class', 'clip-path');
        clip.append("svg:rect");

      }
      clip = this._svg.select('g').select("defs").select('.clip-path')
      .attr("id", "clip" + height)
      .select('rect')
        .attr("id", "clip-rect")
        .attr("x", "0")
        // give some space to draw full stroke-width.
        .attr("y", 0 - 2)
        .attr("width", width)
        .attr("height", height + 2);
      // Put the data in this group
      var g = this._svg.select('g').select('g');
      if (!g[0][0]) {
        g = this._svg.select('g').append('g');
      }

      // Since html5 url is used we need to refer to the absolute url of the
      // clip rect
      g.attr("clip-path", "url(" + $location.absUrl() + "#clip" + height + ")")
        .attr('id', 'feature-group');
      // This url changes constantly so we set a watch.
      this._addLocationWatch(this);
      return this._svg;
    },

    /**
     * Set location watch to update absolute reference to clip-path.
     * @param {NxtD3} instance of NxtD3
     */
    _addLocationWatch: function (instance) {
      instance._locationWatch = $rootScope.$on('$locationChangeSuccess', function (e, newUrl, optOldUrl) {
        if (newUrl === optOldUrl) { return; }
        var height = instance._getHeight(instance.dimensions);
        instance._svg.select('#feature-group')
        .attr("clip-path", "url(" + newUrl + "#clip" + height + ")");
      });
    },

    /**
     * Removes listener to update absolute reference to clip-path.
     */
    destroy: function () {
      if (this._locationWatch) {
        this._locationWatch();
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} svg        d3 selection of an svg.
     * @param {object} dimensions object containing, width, height and
     *                            an object containing top,
     *                            bottom, left and right padding.
     *                            All values in px.
     * @param {array} data        Array of data objects.
     * @param {string} key (int or string) key to the values for the scale and
     *                            axis in the data element
     * @param {object} options    options object that will be passed
     *                            to the d3 scale and axis.
     * @param {boolean} y         Determines whether to return a y scale.
     * @description Computes and returns maxmin, scale and axis.
     * @return {object} containing maxmin, d3 scale and d3 axis.
     */
    _createD3Objects: function (data, key, options, y) {

      // Computes and returns maxmin scale and axis
      var width = this._getWidth(this.dimensions),
          height = this._getHeight(this.dimensions),
          d3Objects = {},
          // y range runs from height till zero, x domain from 0 to width.
          range;

      if (y) {
        range = { max: 0, min: height };
        d3Objects.maxMin = this._maxMin(data, key);
      } else {
        range = { min: 0, max: width };
        d3Objects.maxMin = (this._xDomain.start && this._xDomain.end)
          ? { min: this._xDomain.start, max: this._xDomain.end }
          : this._maxMin(data, key);
      }
      d3Objects.range = range;
      d3Objects.scale = this._makeScale(d3Objects.maxMin, range, options);
      d3Objects.axis = this._makeAxis(d3Objects.scale, options);
      return d3Objects;
    },

    /**
     * @function
     * @description give back a range based on the Dimensions
     * @param {string} - axis can either be 'y' or 'x'
     * return {object} - min and max for the pixel range
     */
    _makeRange: function (axis, dimensions) {
      var width = this._getWidth(dimensions),
          height = this._getHeight(dimensions),
          range;
      if (axis === 'y') {
        range = { max: 0, min: height };
      } else {
        range = { min: 0, max: width };
      }
      return range;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} dimensions object containing, width, height and
     *                            an object containing top,
     *                            bottom, left and right padding.
     *                            All values in px.
     * @description Resizes the canvas and the updates the drawing
     *              area. Does not resize the elements drawn on the
     *              canvas.
     */
    resize: function (dimensions) {
      this.dimensions = angular.extend(this.dimensions, dimensions);
      this._svg = resizeCanvas(this._svg, this.dimensions);
      this._svg = this._createDrawingArea(this._svg, this.dimensions);
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt').NxtD3
     *
     * @param {array} data        Array of data objects.
     * @param {string} key to the value in the array or object.
     * @description returns the maximum and minimum
     * @return {object} containing the max and min
     */
    _maxMin: function (data, key) {
      if (data === null || data.length < 0) {
        return {max: null, min: null};
      }

      var min, max;

      // Key can be a string or integer, or an object containing two y keys.
      if (key.hasOwnProperty
        && key.hasOwnProperty('y0')
        && key.hasOwnProperty('y1')) {
        var minComparator = function (d) { return d[key.y0]; };
        min = d3.min(data, minComparator);

        var maxComparator = function (d) { return d[key.y1]; };
        max = d3.max(data, maxComparator);
      }

      else {
        // min max of d3 filters nulls but not if you cast null into 0. Only cast
        // strings, and array like [0, [3]].
        var comparator = function (d) {
          return typeof(d[key]) === 'string' || d[key] instanceof Array
            ? Number(d[key])
            : d[key];
        };
        max = d3.max(data, comparator);
        min = d3.min(data, comparator);
      }

      return {
        max: max,
        min: min
      };
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} minMax object containing the max and min
     * @param {object} range object contaning from where to where
     *                       the scale runs.
     * @param {object} options object what kind of scale to return
     * @description returns a d3 scale
     * @return {object} d3 scale
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
      } else {
        throw new Error(options.scale + ' is not a valid d3 scale');
      }
      return scale;
    },



    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} scale d3 scale
     * @param {object} options object containing the orientation
     *                         (bottom/left/right/top) and optionally
     *                         an overwrite for the default ticks (5).
     * @description returns a d3 axis
     * @return {object} d3 axis
     */
    _makeAxis: function (scale, options, dimensions) {
      var localeFormatter = this._getLocaleFormatter();
      // Make an axis for d3 based on a scale
      var decimalCount,
          axis = d3.svg.axis()
            .scale(scale)
            .orient(options.orientation);
      axis.ticks(options.ticks || 5);

      if (scale.domain()[0] instanceof Date) {
        var tickFormat = localeFormatter.timeFormat.multi([
          ["%H:%M", function (d) { return d.getMinutes(); }],
          ["%H:%M", function (d) { return d.getHours(); }],
          ["%a %d", function (d) { return d.getDay() && d.getDate() !== 1; }],
          ["%b %d", function (d) { return d.getDate() !== 1; }],
          ["%B", function (d) { return d.getMonth(); }],
          ["%Y", function () { return true; }]
        ]);
        axis.tickFormat(tickFormat);
      } else {
        if (options.tickFormat) {
          axis.tickFormat(options.tickFormat);
        } else {
          var domainDiff = scale.domain()[1] - scale.domain()[0];
          if (domainDiff < 0.5) {
            axis.tickFormat(function (d) {
              return d3.format(".2f")(d);
            });
          } else if (domainDiff < 5.0) {
            axis.tickFormat(function (d) {
              return d3.format(".1f")(d);
            });
          } else {
            axis.tickFormat(
              localeFormatter.numberFormat()
            );
          }
        }
      }

      dimensions = (this.dimensions) ? this.dimensions : dimensions;

      if (options.drawGrid && dimensions) {
        var gridLength = this._getWidth(dimensions);
        axis
          .tickSize(-gridLength);
      }

      return axis;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} svg  d3 selection of svg
     * @param {object} axis d3 axis
     * @param {object} dimensions object containing dimensions.
     * @param {boolean} y to draw y-axis or not (x-axis).
     * @param {int} duration if specified, transitions the drawing.
     * @description Creates axis group if necessary and draws
     *              axis.
     */
    _drawAxes: function (svg, axis, dimensions, y, duration) {
      if (typeof(y) !== 'boolean') { throw new Error('Invalid input: y is not a boolean'); }
      var id = y === true ? 'yaxis': 'xaxis';
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
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} dimensions object containing dimensions
     * @description Deducts the left and right padding to get
     *              the actual width of the drawing area
     * @return {int} width
     */
    _getWidth: function (dimensions) {
      return dimensions.width -
        dimensions.padding.left -
        dimensions.padding.right;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} dimensions object containing dimensions
     * @description Deducts the bottom padding to get
     *              the actual height of the drawing area
     * @return {int} height
     */
    _getHeight: function (dimensions) {
      return dimensions.height -
        dimensions.padding.bottom;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt').NxtD3
     *
     * @param {object} xy object containing y.scales and x.scale.
     * @param {object} keys object containing y.key and x.key.
     * @description returns a line definition for the provided scales.
     * @return {object} d3 path generator for line.
     */
    _createLine: function (xy, keys) {
      var lineGenerator = d3.svg.line()
        .y(function (d) { return xy.y.scale(d[keys.y]); })
        .x(function (d) { return xy.x.scale(d[keys.x]); })
        // interrupt the line when no data
        .defined(function (d) { return !isNaN(parseFloat(d[keys.y])); });

      return extendPathGenerator(lineGenerator);
    },


    /**
     * @function
     * @memberOf angular.module('lizard-nxt').NxtD3
     *s
     * @param {object} xy object containing y.scales and x.scale.
     * @param {object} keys object containing y.key and x.key.
     * @description returns an area definition for the provided scales.
     * @return {object} d3 path generator for area.
     */
    _createArea: function (xy, keys) {
      var areaGenerator = d3.svg.area()
        .x(function(d) { return Math.round(xy.x.scale(d[keys.x]), 10); })
        .y0(function(d) { return Math.round(xy.y.scale(d[keys.y.y0]), 10); })
        .y1(function(d) { return Math.round(xy.y.scale(d[keys.y.y1]), 10); })
        // interrupt the line when no data
        .defined(function (d) {
          var y0 = !isNaN(parseFloat(d[keys.y.y0]));
          var y1 = !isNaN(parseFloat(d[keys.y.y1]));
          return y0 && y1;
        });

      return extendPathGenerator(areaGenerator);
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {int} now timestamp from epoch in ms
     * @param {object} scale d3 scale for time
     * @description draws a line.
     */
    _drawNow: function (now, scale) {
      var height = this._getHeight(this.dimensions);
      var x = scale(now);
      var nowIndicator = this._svg.select('g').select('#feature-group').select('.now-indicator');

      if (!nowIndicator[0][0]) {
        nowIndicator = this._svg.select('g').select('#feature-group').append('line')
          .attr('class', 'now-indicator')
          .style("stroke", "#c0392b") // pommegranate
          .style("stroke-width", 2);
      }
      nowIndicator
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
        .attr("transform", "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")")
        .select('#listeners')
          .attr('width', width)
          .attr('height', height);
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

  /**
   * Adds a string representing a single data point to a path.
   *
   * @param {function}     generator d3 generaotr with x, y0 and y1 functions.
   * @param {string}       path      path to add to.
   * @param {array|object} d         single data point.
   */
  var addPointToAreaPath = function (generator, path, d) {
    var x = generator.x()(d);
    var y0 = generator.y0()(d);
    var y1 = generator.y1()(d);
    if (y0 === y1) { y1 = y1 + 1; } // If same, make it visible by shifting it
                                    // one pixel.
    return path + 'M' + x + ',' + y0 + 'L' + x +',' + y1 + 'Z';
  };


  /**
   * Adds a string representing a single data point to a path.
   *
   * @param {function}     generator d3 generaotr with x and y functions
   * @param {string}       path      path to add to.
   * @param {array|object} d         single data point.
   */
  var addPointToLinePath = function (generator, path, d) {
    var x = generator.x()(d);
    var y = generator.y()(d);
    return path + 'M' + x + ',' + y + 'L' + x +',' + y;
  };

  /**
   * Returns an d3 extended d3 path generator function.
   *
   * When the returned function is called with data it calls the original d3
   * function and adds parts to the path to draw datapoints that are surrounded
   * by undefined data.
   *
   * The path used to have .interpolate('monotone') to create a smoothed line
   * through datapoints, but it makes lines messy when data is missing.
   * Currently no interpolation is used.
   *
   * @param  {function} d3Generator [line|area].
   * @return {function}             d3 path generator.
   */
  extendPathGenerator = function (generator) {

    var addSingleDataPoint = function () {};

    if (generator.name === 'area') {
      addSingleDataPoint = addPointToAreaPath;
    } else {
      addSingleDataPoint = addPointToLinePath;
    }

    var generatePath = function (data) {

      // Get path from d3
      var path = generator.apply(this, arguments);

      var defined = generator.defined();

      // Look for data surrounded by undefined.
      data.forEach(function (d, i) {
        if (defined(d)) {
          var isFirst = i === 0;
          var isLast = i === data.length - 1;
          var yPrevious = data[i - 1];
          var yNext = data[i + 1];

          if ((isLast && isFirst) ||
            (isFirst && !defined(yNext)) ||
            (isLast && !defined(yPrevious)) ||
            (!isFirst && !isLast && !defined(yPrevious) && !defined(yNext))
            ) {

            // Add a string to path.
            path = addSingleDataPoint(generator, path, d);

          }
        }
      });

      return path;
    };

    return generatePath;

  };


  return NxtD3;

}]);
