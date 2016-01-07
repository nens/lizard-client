/**
 * @name TimeLineService
 * @class angular.module('lizard-nxt')
  .TimeLineService
 * @memberOf app
 *
 * @summary Service to create and update a timeline. Used by timeline-directive.
 *
 * @description Inject "Timeline" and call new timeline(<args>) to create a
 * timeline. Currently the timeline supports circles (events) and vertical bars
 * (rain intensity). The user may interact with the timeline through click and
 * zoom functions.
 *
 * Everything in the timeline is animated for NxtD3.transTime milliseconds. To
 * add new elements to the timeline, make sure the elements are updated on zoom,
 * and resize. The timeline resizes *before* elements are added and *after*
 * elements are removed. Therefore resize transitions should be delayed with
 * NxtD3.transTime when the timeline is shrinking, as is happening in
 * resizeTimelineCanvas.
 */
angular.module('lizard-nxt')
  .factory("Timeline", ["NxtD3", "UtilService", "State",
      function (NxtD3, UtilService, State) {

  // Timeline
  var initialHeight,

  // D3 components
  xScale, // The d3 scale for placement on the x axis within the whole
          // timeline. Is only updated when zoomTo is called, or the window
          // resizes.
  ordinalYScale, // Scale used to place events in circles for each type

  // Interaction functions
  clicked = null,
  zoomed = null,
  zoomend = null,

  // Timeline elements
  futureIndicator,
  aggWindow, // aggregation window
  circles, // events start - end
  bars, // rain intensity
  tickmarks,
  TICKMARK_HEIGHT = 5, // data availability indicators
  MAX_CIRCLE_SIZE = 16;

  /**
   * @constructor
   * @memberOf angular.module('lizard-nxt')
   * TimeLineService
   *
   * @param {object} element - svg element for the timeline.
   * @param {object} dimensions - object containing, width, height, height per
   *  line of events, height per line of bars and an object containing top,
   *  bottom, left and right padding. All values in px.
   * @param {integer} start - begin value in milliseconds from epoch.
   * @param {integer} end - end value in milliseconds from epoch.
   * @param {object} interaction  - optional object containing callback
   * functions for zoom, click and brush interaction with the rest of the
   *  angular.module('lizard-nxt')
   * @param {integer} nEvents - number of event types (event series).
   */
  function Timeline(element, dimensions, start, end, interaction) {
    NxtD3.call(this, element, dimensions);
    initialHeight = dimensions.height;
    this._svg = this._createDrawingArea();
    this._svg = addElementGroupsToCanvas(this._svg, this.dimensions);
    this._initDimensions = dimensions;
    xScale = this._makeScale(
      {min: start, max: end},
      {min: 0, max: this._getWidth(dimensions)},
      {scale: 'time' }
    );
    drawTimelineAxes(this._svg, xScale, dimensions);
    this.addFutureIndicator();
    this.addInteraction(interaction);
  }

  Timeline.prototype = Object.create(NxtD3.prototype, {

    constructor: Timeline,

    /**
     * @attribute
     * @type function to be used to format datetime.
     */
    format: {
      value: NxtD3
        .prototype._localeFormatter.nl_NL.timeFormat("%a %e %b %Y %H:%M")
    },
    format_aggwindow: {
      value: NxtD3.prototype._localeFormatter.nl_NL.timeFormat("%e %b %-H:%M")
    },

    /**
     * @function
     * @summary Adds a now indicator to timeline.
     * @description From 'now' the background of the timeline gets a different
     * style.
     */
    addFutureIndicator: {
      value: function () {
        var width = 20000,
            height = this._getHeight(this.dimensions);

        futureIndicator = this._svg.select("#feature-group").append("rect")
          .attr("height", height)
          .attr("width", width)
          .attr('title', 'Het gedeelte van de tijdlijn dat in de toekomst ligt')
          .attr("id", "nodata")
          .attr("x", xScale(Date.now()))
          .attr("opacity", 0.8)
          .style("fill", "#DDD");
      }
    },

    addClickListener: {
      value: function (clickFn) {
        if (clickFn) {
          clicked = setClickFunction(
            xScale,
            this.dimensions,
            clickFn,
            this.drawAggWindow
          );
        }
        this._svg.select('#listeners').on("click", clicked);
      }
    },

    removeClickListener: {
      value: function () {
        this._svg.select('#listeners').on("click", null);
      }
    },

    addInteraction: {
      value: function (interaction) {
        if (!interaction) { return; }
        this.addZoomListener(interaction.zoomFn, interaction.zoomEndFn);
        this.addClickListener(interaction.clickFn);
      }
    },

    /**
     * @function
     * @summary Draws an aggWindow at timestamp.
     * @description Left of aggWindow is timeState.at, size is dependent on
     * current aggWindow interval on timeState.
     *
     * TODO: Rasterstore's "day-level aggregated rain intensity data" has
     * discrete one-day/24h intervals (=good), however those intervals are
     * from 8:00 GMT (in the morning) to the next day's 8:00 GMT in the morning
     * (=bad).
     *
     * This doens't play nice with the aggWindow to be drawn, since (for 24h
     * aggregation) this preferably starts on 00:00, and ends 24h later, again
     * on 00:00.
     *
     */
    drawAggWindow: {
      value: function (timestamp, interval, oldDimensions) {
        var height;

        if (!aggWindow) {
          height = this._getHeight(this.dimensions);
          aggWindow = this._svg.select('#feature-group').append("g")
            .attr('class', 'agg-window-group');
          aggWindow
            .append("rect")
              .attr("class", "aggwindow-rect")
              .attr("height", height)
              .attr("x", 0)
              .attr("y", 0);
        }

        aggWindow.select('.aggwindow-rect')
          .attr("x", function () {
            return Math.round(xScale(new Date(timestamp)));
          });

        if (oldDimensions && this.dimensions.height < oldDimensions.height) {
          height = this._getHeight(this.dimensions);
          aggWindow.select('.aggwindow-rect')
            .transition()
            .delay(this.transTime)
            .duration(this.transTime)
            .attr("height", height);
        } else if (oldDimensions) {
          height = this._getHeight(this.dimensions);
          aggWindow.select('.aggwindow-rect')
            .transition()
            .duration(this.transTime)
            .attr("height", height);
        }

        if (interval) {
          var width = xScale(new Date(timestamp + (interval))) -
          xScale(new Date(timestamp));
          aggWindow.select('.aggwindow-rect').attr("width", width);
        }
      }
    },

    /**
     * @function
     * @summary Resizes the timeline.
     * @description Makes a deep copy of the old dimensions, updates canvas,
     * updates all elements, redraws axis.
     *
     * @param {object} dimensions object containing, width, height, height per
     *  line of events, height per line of bars and an object containing top,
     *  bottom, left and right padding. All values in px.
     * @param {int} timestamp - timestamp in milliseconds since epoch.
     * @param {interval} interval - aggregation interval in ms.
     * @param {object} features - geojson object with event features.
     * @param {int} nEvents - number of event types (event series).
     */
    resize: {
      value: function (newDimensions, timestamp, interval, nEvents) {
        var oldDimensions = angular.copy(this.dimensions);
        NxtD3.prototype.resize.call(this, newDimensions);
        this.updateElements(oldDimensions, timestamp, interval);
        this._svg = resizeTimelineCanvas(this._svg, oldDimensions, this.dimensions);

        ordinalYScale = makeEventsYscale(initialHeight, this.dimensions);
        xScale.range([0, newDimensions.width - newDimensions.padding.right]);
        drawTimelineAxes(this._svg, xScale, newDimensions);
      }
    },

    /**
     * @function
     * @summary Update all elements to accomadate new dimensions.
     *
     * @param {object} oldDimensions - copy of the old dimensions
     * @param {int} timestamp - timestamp in milliseconds since epoch.
     * @param {interval} interval - aggregation interval in ms.
     */
    updateElements: {
      value: function (oldDimensions, timestamp, interval) {

        if (bars && oldDimensions) {
          updateRectangleElements(bars, xScale, oldDimensions, this.dimensions);
        }

        if (futureIndicator) {
          updateFutureIndicator(
            futureIndicator,
            xScale,
            oldDimensions,
            this.dimensions
          );
        }

        if (aggWindow) {
          this.drawAggWindow(timestamp, interval, oldDimensions);
        }

        if (tickmarks) {
          updateTickmarks(tickmarks, this.dimensions, oldDimensions);
        }

      }
    },

    /**
     * @function
     * @summary Updates, adds or removes all circles in the data object.
     *
     * @param {array} data array of objects:
     *   [{properties.timestamp_end: timestamp,
     *     properties.timestamp_start: timestamp,
     *     properties.event_series_id: event_series id,
     *     geometry.coordinates: [lat, lon]}]
     * @param {integer} order - Order of events.
     * @param {string} slug - Slug of event layer.
     * @param {string} color - Hex color code.
     */
    drawCircles: {
      value: function (data, order, slug, color, aggWindow) {
        circles = drawCircleElements(
          this._svg,
          this.dimensions,
          xScale,
          ordinalYScale,
          data,
          order,
          slug,
          color,
          aggWindow
        );
      }
    },

    drawTickMarks: {
      value: function (data) {
        tickmarks = drawTickMarkElements(this._svg, this.dimensions, data);
      }
    },

    /**
     * @function
     * @summary Updates, adds or removes all bars in the data object.
     *
     * @param {array} data - array of arrays [[bar_timestamp, bar_height]]
     */
    drawBars: {
      value: function (data) {

        /**
         * candidate to replace with Dirk's null checker function.
         */
        if (data.data === 'null') {
          return false;
        }

        var height = this.dimensions.bars;

        var y = this._maxMin(data, '1');
        var options = {scale: 'linear'};
        var yScale = this._makeScale(
          y,
          {min: 0, max: height},
          options
        );
        bars = drawRectElements(
          this._svg, this.dimensions, data, xScale, yScale);
      }
    },

    /**
     * @function
     * @summary Remove bars from timeline.
     */
    removeBars: {
      value: function () {
        drawRectElements(this._svg, this.dimensions, []);
        bars = undefined;
      }
    },

    /**
     * @function
     * @summary Update domain of scale and call functions to update timeline to
     * new scale.
     *
     * @param {int} start - timestamp in ms since epoch.
     * @param {int} end - timestamp in ms since epoch.
     * @param {int} interval - aggregation window in ms.
     */
    zoomTo: {
      value: function (start, end, interval) {
        xScale.domain([new Date(start), new Date(end)]);
        this.addZoomListener();
        this.drawAggWindow(start, interval);
      }
    },

    addZoomListener: {
      value: function (zoomFn, zoomEndFn) {
        if (zoomFn) {
          zoomed = setZoomFunction(
            this._svg,
            this.dimensions,
            xScale,
            zoomFn
          );
        }
        if (zoomEndFn) {
          zoomend = setZoomEndFunction(zoomEndFn);
        }
        this._svg.select('#listeners').call(d3.behavior.zoom()
          .x(xScale)
          .on("zoom", zoomed)
          .on("zoomend", zoomend)
        );

        // Move listener rectangle to the front
        var el = this._svg.select('#listeners').node();
        el.parentNode.appendChild(el);
      }
    }
  });


  /**
   * @function
   * @summary Draw timeline axes.
   *
   * @param {object} svg - timeline svg elements.
   * @param {object} xAxis - D3 axis object.
   * @param {object} dimensions - dimensions object.
   * @param {int} duration - duration in ms.
   */
  var drawTimelineAxes = function (svg, xScale, dimensions, duration) {
    var width = Timeline.prototype._getWidth(dimensions);
    // The actual d3-axis is smaller than the timeline. The scale is copied
    // and transformed to an axis with a restricted range and domain.
    var xAxisScale = xScale.copy();

    var XAXIS_PADDING = 50;

    xAxisScale
      .domain([
        xScale.invert(XAXIS_PADDING),
        xScale.invert(width - XAXIS_PADDING)
      ])
      .range([XAXIS_PADDING, width - XAXIS_PADDING]);

    var xAxis = Timeline.prototype._makeAxis(
      xAxisScale,
      {orientation: "bottom", ticks: 7}
    );

    Timeline.prototype._drawAxes(svg, xAxis, dimensions, false, duration);
    var axisEl = svg.select('#xaxis')
        .attr("class", "x axis timeline-axis");

    addClickToAxisTicks(axisEl.selectAll('text'));
  };

  /**
   * Takes a d3 multiselection of text elements and add click interaction to
   * zoom to rounded dates.
   * @param {object} d3 selection ticks text elements of tick marks.
   */
  var addClickToAxisTicks = function(ticks) {
    ticks
      .each(function (d) {
        if (d.getMinutes() === 0) {
          d3.select(this).attr('class', 'clickable');
        }
      })
      .on('click', zoomToHourDayMonthOrYear);
  };

  /**
   * Gets a date object, typically from a d3 tick mark. If it is a round
   * year|month|day|hour it zooms the timeline and calls zoom callbacks. It does
   * not zoom to minutes and seconds.
   * @param  {date} d
   */
  var zoomToHourDayMonthOrYear = function (d) {
    var end = new Date(d.getTime());
    if (d.getHours() === 0) {
      if (d.getDate() === 1) {
        if (d.getMonth() === 0) {
          xScale.domain([d, end.setYear(d.getFullYear() + 1)]);
        }
        else {
          xScale.domain([d, end.setMonth(d.getMonth() + 1)]);
        }
      }
      else {
        xScale.domain([d, end.setDate(d.getDate() + 1)]);
      }
    }
    else {
      xScale.domain([d, end.setHours(d.getHours() + 1)]);
    }
    zoomed();
    zoomend();
  };

  /**
   * Draw start stop draws the fixed text labels displaying start and stop of
   * the domain.
   *
   * @param  {svg}    svg
   * @param  {scale}  xScale
   * @param  {object} dimensions
   */
  var drawStartStop = function (svg, xScale, dimensions) {
    var format = Timeline.prototype.format,
        height = Timeline.prototype._getHeight(dimensions),
        width = Timeline.prototype._getWidth(dimensions),
        startEl = svg.select('.timeline-start-stop')
          .select('.tick-start').select('text'),
        stopEl = svg.select('.timeline-start-stop')
          .select('.tick-stop').select('text');

    if (!startEl[0][0]) {
      startEl = svg
        .append('g')
        .attr('class', 'timeline-start-stop timeline-axis')
        .attr("transform", "translate(0, " + height + ")")
          .append('g')
          .attr('class', 'tick tick-start')
          .append('text')
            .attr('y', 9)
            .attr('x', dimensions.padding.left)
            .attr('dy', '.71em');

      stopEl = svg.select('.timeline-start-stop')
        .append('g')
          .attr('class', 'tick tick-stop')
          .append('text')
            .attr('y', 9)
            .attr('dy', '.71em');
    }

    startEl
      .text(format(xScale.domain()[0]));
    stopEl
      .text(format(xScale.domain()[1]))
      .attr('x', dimensions.width - dimensions.padding.right
        - stopEl.node().getBBox().width);
  };

  /**
   * @function
   * @summary Creates groups according to dimensions to accomodate all timeline
   * elements
   *
   * @param  {object} svg element to create timeline.
   * @param  {object} dimensions object containing, width, height, height per
   *  line of events, height per line of bars and an object containing top,
   *  bottom, left and right padding. All values in px.
   * @returns {object} svg timeline svg.
   */
  var addElementGroupsToCanvas = function (svg, dimensions) {
    var width = Timeline.prototype._getWidth(dimensions),
    height = Timeline.prototype._getHeight(dimensions);
    // Create group for rain bars
    svg.select('#feature-group').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'rain-bar');
    // Create group for circles
    svg.select('#feature-group').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'circle-group');
    // Create group for tickmarks
    svg.select('#feature-group').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'tickmark-group');

    return svg;

  };

  /**
   * @function
   * @summary Updates the timeline svg. With a delay when getting smaller,
   * without delay when becoming larger.
   *
   * @param  {object} svg - element to create timeline.
   * @param  {object} oldDims - object containing, width, height, height per
   *  line of events, height per line of bars and an object containing top,
   *  bottom, left and right padding. All values in px.
   *  @param {object} newDims - new dimensions, same structure as oldDims.
   */
  var resizeTimelineCanvas = function (svg, oldDims, newDims) {
    var width = Timeline.prototype._getWidth(newDims),
    height = Timeline.prototype._getHeight(newDims);
    if (newDims.height < oldDims.height) {
      svg.transition()
        .delay(Timeline.prototype.transTime)
        .duration(Timeline.prototype.transTime)
        .select("g")
        .attr("transform", "translate(" + newDims.padding.left + ", 0)")
        .select('#xaxis')
        .attr("transform", "translate(0 ," + height + ")");
    } else {
      svg.transition()
        .duration(Timeline.prototype.transTime)
        .select("g")
        .attr("transform", "translate(" + newDims.padding.left + ", 0)")
        .select('#xaxis')
        .attr("transform", "translate(0 ," + height + ")");
    }
    svg.select("#feature-group").selectAll("g")
      .attr("height", height)
      .attr("width", width);
    return svg;
  };

  /**
   * @function
   * @summary Create function that updates all elements to zoom action and
   * calls zoomFn.
   * @description Put all scope specific in the zoom callback from the
   * directive, all the standard (re-)placement of elements in here.
   */
  var setZoomFunction = function (
    svg, dimensions, xScale, zoomFn) {
    var zoomed = function () {
      // might not exist when called programmatically
      if (d3.event.sourceEvent) {
        d3.event.sourceEvent.preventDefault();
      }

      var ONE_HOUR = 1000 * 60 * 60;

      var start = UtilService.getMinTime(xScale.domain()[0].getTime()),
          end = UtilService.getMaxTime(xScale.domain()[1].getTime());

      // Min domain when zooming is ONE_HOUR
      if (start === UtilService.MIN_TIME && end !== UtilService.MAX_TIME) {
        end = end >= start + ONE_HOUR  ? end : start + ONE_HOUR;
      }

      else if (end === UtilService.MAX_TIME && start !== UtilService.MIN_TIME) {
        start = start <= end - ONE_HOUR ? start : end - ONE_HOUR;
      }

      xScale.domain([start, end]);

      drawTimelineAxes(svg, xScale, dimensions);

      if (bars) {
        var barData = bars.data();
        // we need at least 2 elements to calc a new width
        if (barData[1] !== undefined) {
          var newWidth = xScale(barData[1][0]) - xScale(barData[0][0]);
          bars
            .attr("x", function (d) { return xScale(d[0]) - newWidth; })
            .attr('width', newWidth);
        }
      }

      if (futureIndicator) {
        var width = Timeline.prototype._getWidth(dimensions);
        futureIndicator
          .attr('x', xScale(Date.now()));
      }

      if (circles) {
        var xOneFunction = function (d) {
          var interval = 0;
          return xScale(parseFloat(d.timestamp) + (interval / 2));
        };

        d3.select("#circle-group").selectAll("circle")
          .attr("cx", xOneFunction);
      }

      if (tickmarks) {
        updateTickmarks(tickmarks, dimensions);
      }

      if (zoomFn) {
        zoomFn(xScale);
      }
    };

    return zoomed;
  };

  /**
   * @function
   * @summary Create zoomend.
   */
  var setZoomEndFunction = function (zoomEndFn) {
    var zoomend = function () {
      zoomEndFn();
    };
    return zoomend;
  };

  /**
   * @function
   * @summary Creates click function.
   * @description Creates click function. If default is prevented, the click
   * was a zoom.
   */
  var setClickFunction = function (xScale, dimensions, clickFn, drawAggWindow) {
    var clicked = function () {
      // Check whether user is dragging instead of clicking
      if (!d3.event.defaultPrevented) {
        var x = d3.event.clientX
          - UtilService.getLeftMargin(State.context)
          - dimensions.padding.left;
        var ts = xScale.invert(x);
        clickFn(ts, dimensions);
      }
    };
    return clicked;
  };

  /**
   * @function
   * @summary Moves rectangle elements to right position relative to the
   * timeline svg and xaxis.
   * @description Everything to the svg is relative to the top left corner, if
   * the timeline grows, the bars need to move further down. The amount is
   * computed from the difference between the old and new dimensions and the
   * move is delayed depending on the growth or shrinkage of the timeline.
   */
  var updateRectangleElements = function (rectangles, xScale, oldDimensions,
                                          newDimensions) {
    // UPDATE
    // Update old elements as needed.
    if (rectangles[0].length > 0) {
      var barHeight = newDimensions.bars,
          y = Timeline.prototype._maxMin(rectangles.data(), '1'),
          options = {scale: 'linear'},
          newHeight = Timeline.prototype._getHeight(newDimensions),
          oldHeight = Timeline.prototype._getHeight(oldDimensions),
          heightDiff = newHeight - oldHeight,
          yScale = Timeline.prototype._makeScale(
            y,
            {min: 0, max: barHeight},
            options),
            barWidth = Number(rectangles.attr('width'));

      if (heightDiff < 0) {

        rectangles.transition()
          .duration(Timeline.prototype.transTime)
          .delay(Timeline.prototype.transTime)
          .attr("height", function (d) {return yScale(d[1]); })
          .attr("y", function (d) {
            return newHeight - yScale(d[1]);
          })
          .attr("x", function (d) {
            return xScale(d[0]) - barWidth;
          });

      } else {
        rectangles.transition()
          .duration(Timeline.prototype.transTime)
          .attr("height", function (d) {return yScale(d[1]); })
          .attr("y", function (d) {
            return newHeight - yScale(d[1]);
          })
          .attr("x", function (d) {
            return xScale(d[0]) - barWidth;
          });
      }
    }
  };

  /**
   * @function
   * @summary update future indicator.
   *
   * @param {object} futureIndicator - D3 selection.
   * @param {object} xScale - D3 scale.
   * @param {object} oldDimensions - previous timeline dimensions object.
   * @param {object} dimensions - timeline dimensions object.
   */
  var updateFutureIndicator = function (
    futureIndicator,
    xScale,
    oldDimensions,
    dimensions
    ) {

    var height = Timeline.prototype._getHeight(dimensions),
        width = Timeline.prototype._getWidth(dimensions);

    futureIndicator
      .attr('x', xScale(Date.now()));

    if (dimensions.height < oldDimensions.height) {
      futureIndicator
       .transition()
       .delay(Timeline.prototype.transTime)
       .duration(Timeline.prototype.transTime)
       .attr('height', height);
    } else {
      futureIndicator
       .transition()
       .duration(Timeline.prototype.transTime)
       .attr('height', height);
    }
  };
  var updateTickmarks = function (tickmarks, dimensions, oldDimensions) {
    var height = Timeline.prototype._getHeight(dimensions),
        TICKMARK_HEIGHT = 5;

    // update horizontal
    tickmarks.attr("x", function (d) { return xScale(d); });

    // update vertical
    if (oldDimensions && dimensions.height < oldDimensions.height) {
      tickmarks.transition()
        .delay(Timeline.prototype.transTime)
        .duration(Timeline.prototype.transTime)
        .attr("y", height - TICKMARK_HEIGHT);
    }

    else if (oldDimensions &&  dimensions.height > oldDimensions.height) {
      tickmarks.transition()
        .duration(Timeline.prototype.transTime)
        .attr("y", height - TICKMARK_HEIGHT);
    }
  };

  /**
   * @function
   * @summary Draws rectangular tickmarks for every timestamp in data array.
   *
   * @param {object} svg - timeline svg object.
   * @param {object} dimensions - timeline dimensions object.
   * @param {integer []} data - list of timestamps in ms.
   *
   * @returns {object} d3 selection object with tickmarks for each timestamp.
   */
  var drawTickMarkElements = function (svg, dimensions, data) {
    var height = Timeline.prototype._getHeight(dimensions),
        TICKMARK_HEIGHT = 5,
        TICKMARK_WIDTH = 2;

    var group = svg
      .select("g")
      .select("#tickmark-group");

    // DATA JOIN
    // Join new data with old elements, based on the timestamp.
    tickmarks = group.selectAll("rect")
      .data(data, function  (d) { return d; });

    // UPDATE
    tickmarks.transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("y", height - TICKMARK_HEIGHT)
      .attr("x", function (d) { return xScale(d); });

    // ENTER
    tickmarks.enter().append("rect")
      .attr("class", "tickmark")
      .attr("y", height)
      .attr("width", TICKMARK_WIDTH)
      .attr("height", 0)
    .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("x", function (d) { return xScale(d); })
      .attr("y", height - TICKMARK_HEIGHT)
      .attr("height", TICKMARK_HEIGHT);

    // EXIT
    // Remove old elements as needed.
    tickmarks.exit()
      .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("y", height)
      .attr("height", 0)
      .remove();

    return tickmarks;

  };

  /**
   * @function
   * @summary Draws horizontal line elements according to a d3 update pattern.
   *
   * @param {object} svg - timeline svg object.
   * @param {object} dimensions - timeline dimensions object.
   * @param {object} xScale - D3 scale object.
   * @param {object} yScale - D3 scale object.
   * @param {object} data - geojson data structure:
   *   [{properties.timestamp_end: timestamp,
   *     properties.timestamp_start: timestamp,
   *     properties.event_series_id: event_series id,
   *     geometry.coordinates: [lat, lon]}]
   * @param {int} order - Order of data (which level to draw in timeline).
   * @param {string} slug - slug of event series.
   * @param {string} color - Hex color code.
   */
  var drawCircleElements = function (
    svg, dimensions, xScale, yScale, data, order, slug, color, aggWindow) {

    var MIN_CIRCLE_SIZE = 3,
        MAX_COUNT = 100;

    var xOneFunction = function (d) {
      return xScale(parseFloat(d.timestamp) - (aggWindow / 2));
    };

    var yFunction = function (d) { return yScale(order); };

    var rFunction = function (d) {
      return UtilService.lin2log(
        d.count, MIN_CIRCLE_SIZE, MAX_CIRCLE_SIZE, 1, MAX_COUNT);
    };

    // if data exists, check if group is available for this series and create
    // if no data, remove circles
    if (data !== undefined) {
      var group = svg
                    .select("g")
                    .select("#circle-group")
                    .select("#" + slug);
      if (!group[0][0]) {
        group = svg.select("g").select("#circle-group").append("g")
          .attr("id", slug);
      }

      // DATA JOIN
      // Join new data with old elements, based on the id value.
      circles = group.selectAll("circle")
        .data(data, function  (d) { return d.timestamp; });
    } else if (data === undefined) {
      // if no data is defined, remove all groups
      var groups = svg.select("g").select("#circle-group").selectAll("g");
      groups.remove();

      return;
    }

    // UPDATE
    // Update old elements as needed.
    circles.transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("stroke", color)
      .attr("fill", color)
      .attr("cx", xOneFunction)
      .attr("cy", yFunction)
      .attr("r", rFunction);

    // ENTER
    // Create new elements as needed.
    circles.append("g");
    circles.enter().append("circle")
      .attr("class", "event")
      .attr("fill", color)
      .attr("stroke", color)
    .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("cx", xOneFunction)
      .attr("cy", yFunction)
      .attr("r", rFunction);

    // EXIT
    // Remove old elements as needed.
    circles.exit()
      .transition()
      .delay(0)
      .duration(Timeline.prototype.transTime)
    .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("stroke-width", 0)
      .style("fill-opacity", 0)
      .remove();

    return circles;
  };

  /**
   * @function
   * @summary Draws bar elements according to a d3 update pattern.
   */
  var drawRectElements = function (svg, dimensions, data, xScale, yScale) {

    var height = Timeline.prototype._getHeight(dimensions),
    // Join new data with old elements, based on the timestamp.
    bars = svg.select("g").select('#rain-bar').selectAll('.bar-timeline')
        .data(data, function  (d) { return d[0]; });

    var barWidth;
    if (data.length > 1) {
      barWidth = xScale(data[1][0]) - xScale(data[0][0]);
    } else {
      barWidth = 0;
    }

    // UPDATE
    // Update old elements as needed.
    bars.transition()
      .duration(Timeline.prototype.transTime)
      .attr("x", function (d) { return xScale(d[0]) - barWidth; })
      .attr('width', barWidth)
      .attr("height", function (d) { return yScale(d[1]); })
      .attr("y", function (d) { return height - yScale(d[1]); });

    // ENTER
    // Create new elements as needed.
    bars.enter().append("rect")
      .attr("class", "bar-timeline")
      .attr("x", function (d) {
        return xScale(d[0]) - barWidth;
      })
      .attr('width', barWidth)
      .attr("height", 0)
      .attr("y", height)
      .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("height", function (d) { return yScale(d[1]); })
      .attr("y", function (d) { return height - yScale(d[1]); });

    // EXIT
    // Remove old elements as needed.
    bars.exit()
      .transition()
      .duration(Timeline.prototype.transTime)
      .attr("y", height)
      .attr("height", 0)
      .remove();

    var barsEl = svg.select("g").select('#rain-bar').node();
    barsEl.parentNode.insertBefore(barsEl, barsEl.parentNode.firstChild);

    return bars;
  };


  /**
   * @function
   * @summary Returns a d3 scale to place events vertically in circles above
   * each other.
   *
   * @param  {int} iniH initial height of the timeline in px.
   * @param  {object} dims current dimensions of the timeline.
   */
  var makeEventsYscale = function (iniH, dims) {
    return function (order) {
      return dims.events * order - MAX_CIRCLE_SIZE;
    };
  };

  return Timeline;

}]);
