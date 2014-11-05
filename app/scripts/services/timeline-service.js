/**
 * @name TimeLineService
 * @class angular.module('lizard-nxt')
  .TimeLineService
 * @memberOf app
 *
 * @summary Service to create and update a timeline. Used by timeline-directive.
 *
 * @description Inject "Timeline" and call new timeline(<args>) to create a
 * timeline. Currently the timeline supports lines (events) and vertical bars
 * (rain intensity). The user may interact with the timeline through click and
 * zoom functions. 
 *
 * Everything in the timeline is animated for NxtD3.transTime milliseconds. To
 * add new elements to the timeline, make sure the elements are updated on zoom,
 * and resize. The timeline resizes before elements are added and after
 * elements are removed. Therefore new and old dimensions need to be compared
 * to delay the resize of elements the same amount as the canvas.
 */
angular.module('lizard-nxt')
  .factory("Timeline", ["NxtD3", function (NxtD3) {

  // Timeline
  var initialHeight,

  // D3 components
  xScale, // The only d3 scale for placement on the x axis within the whole
          // timeline. Is only updated when zoomTo is called, or the window
          // resizes.
  xAxis,
  ordinalYScale, // Scale used to place events in lines for each type

  // Interaction functions
  clicked,
  zoomed,
  zoomend,

  // Timeline elements
  nowIndicator,
  aggWindow, // aggregation window
  lines, // events start - end
  bars; // rain intensity

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
  function Timeline(element, dimensions, start, end, interaction, nEvents) {
    NxtD3.call(this, element, dimensions);
    initialHeight = dimensions.height;
    this.nEvents = nEvents;
    this._svg = addElementGroupsToCanvas(this._svg, this.dimensions);
    var width = dimensions.width -
                dimensions.padding.left -
                dimensions.padding.right;
    xScale = this._makeScale({min: start, max: end},
                             {min: 0, max: width},
                             {scale: 'time' });
    xAxis = this._makeAxis(xScale, {orientation: "bottom", ticks: 5});
    drawTimelineAxes(this._svg, xAxis, dimensions);
    if (interaction) {
      if (interaction.zoomFn) {
        zoomed = setZoomFunction(this._svg, this.dimensions, xScale, xAxis,
          interaction.zoomFn);
      }
      if (interaction.clickFn) {
        clicked = setClickFunction(xScale, this.dimensions,
          interaction.clickFn);
      }
      if (interaction.zoomEndFn) {
        zoomend = setZoomEndFunction(interaction.zoomEndFn);
      }
    }
  }

  Timeline.prototype = Object.create(NxtD3.prototype, {

    constructor: Timeline,

    /**
     * @function
     * @summary Adds a now indicator to timeline.
     * @description From 'now' the background of the timeline gets a different
     * style.
     */
    addNowIndicator: {
      value: function () {
        var width = this._getWidth(this.dimensions),
        height = this._getHeight(this.dimensions);

        nowIndicator = this._svg.select("g").append("rect")
          .attr("height", height)
          .attr("width", width)
          .attr("id", "nodata")
          .attr("x", function () {return xScale(Date.now()); })
          .attr("opacity", 0.8)
          .style("fill", "#DDD");
      }
    },

    addClickListener: {
      value: function () {
        this._svg.on("click", clicked);
      }
    },

    removeClickListener: {
      value: function () {
        this._svg.on("click", null);
      }
    },


    /**
     * @function
     * @summary Draws an aggWindow at timestamp.
     * @description Left of aggWindow is timeState.at, size is dependent on 
     * current aggWindow interval on timeState.
     */
    drawAggWindow: {
      value: function (timestamp, interval) {

        var height = this._getHeight(this.dimensions);
        var width = xScale(new Date(timestamp + (interval))) -
          xScale(new Date(timestamp));

        if (!aggWindow) {
          aggWindow = this._svg.append("g").append("rect")
            .attr("class", "aggwindow")
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("opacity", 0.6)
            .attr("style", "fill: #34495e;");
        }

        var offset = this.dimensions.padding.left;
        
        // UPDATE
        aggWindow
          .attr("x", function () {
            return (offset + xScale(new Date(timestamp)));
          })
          .transition()
          .duration(this.transTime)
          .attr("height", height)
          .attr("width", width);
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
        this.dimensions = newDimensions;
        this._svg = updateCanvas(this._svg, oldDimensions, this.dimensions);

        ordinalYScale = makeEventsYscale(initialHeight, this.dimensions);

        var oldWidth = xScale.range()[1];
        xScale.range([0, newDimensions.width]);

        var newWidth = xScale.range()[1];

        drawTimelineAxes(this._svg, xAxis, newDimensions);
        this.updateElements(
          oldDimensions, timestamp, interval);
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

        if (nowIndicator) {
          updateNowElement(nowIndicator, xScale, this.dimensions);
        }

        if (aggWindow) {
          setTimeout((function () {
            this.drawAggWindow(timestamp, interval);
          }).call(this), this.transTime);
        }
      }
    },

    /**
     * @function
     * @summary Updates, adds or removes all lines in the data object.
     *
     * @param {array} data array of objects:
     *   [{properties.timestamp_end: timestamp,
     *     properties.timestamp_start: timestamp,
     *     properties.event_series_id: event_series id,
     *     TODO: should maybe be style? check with branch Fritz styling events.
     *     properties.color: <color code>,
     *     geometry.coordinates: [lat, lon]}]
     * @param {integer} order - Order of events.
     */
    drawLines: {
      value: function (data, order, series_ids) {
        lines = drawLineElements(
          this._svg,
          this.dimensions,
          xScale,
          ordinalYScale,
          data,
          order,
          series_ids
        );
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

        var height = initialHeight -
                     this.dimensions.padding.top -
                     this.dimensions.padding.bottom +
                     this.dimensions.bars;

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
        xAxis = this._makeAxis(xScale, {orientation: "bottom", ticks: 5});
        drawTimelineAxes(this._svg, xAxis, this.dimensions, this.transTime);
        this.addZoomListener();
        this.drawAggWindow(start, interval);
      }
    },

    addZoomListener: {
      value: function () {
        this._svg.call(d3.behavior.zoom()
          .x(xScale)
          .on("zoom", zoomed)
          .on("zoomend", zoomend)
        );
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
  var drawTimelineAxes = function (svg, xAxis, dimensions, duration) {
    Timeline.prototype._drawAxes(svg, xAxis, dimensions, false, duration);
    var axisEl = svg.select('#xaxis')
        .attr("class", "x axis timeline-axis");
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
    svg.select('g').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'rain-bar');
    // Create group for lines
    svg.select('g').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'circle-group');

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
  var updateCanvas = function (svg, oldDims, newDims) {
    var width = Timeline.prototype._getWidth(newDims),
    height = Timeline.prototype._getHeight(newDims);
    if (newDims.height < oldDims.height) {
      svg.transition()
        .delay(Timeline.prototype.transTime)
        .duration(Timeline.prototype.transTime)
        .attr('height', newDims.height)
        .attr('width', newDims.width)
        .select("g")
        .attr("transform", "translate(" + newDims.padding.left + ", 0)")
        .select('#xaxis')
        .attr("transform", "translate(0 ," + height + ")");
    } else {
      svg.transition()
        .duration(Timeline.prototype.transTime)
        .attr('height', newDims.height)
        .attr('width', newDims.width)
        .select("g")
        .attr("transform", "translate(" + newDims.padding.left + ", 0)")
        .select('#xaxis')
        .attr("transform", "translate(0 ," + height + ")");
    }
    svg.select("g").select(".plot-temporal")
      .attr("height", height)
      .attr("width", width);
    // Update rain bar group
    svg.select('g').select('#rain-bar')
      .attr('width', width)
      .attr('height', height);
    // Update circle group
    svg.select('g').select('#circle-group')
      .attr('width', width)
      .attr('height', height);
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
    svg, dimensions, xScale, xAxis, zoomFn) {
    var zoomed = function () {
      drawTimelineAxes(svg, xAxis, dimensions);

      if (bars) {
        var barData = bars.data();
        if (barData[0] !== undefined) {
          var newWidth = xScale(barData[1][0]) - xScale(barData[0][0]);
          bars
            .attr("x", function (d) { return xScale(d[0]) - 0.5 * newWidth; })
            .attr('width', newWidth);
        }
      }

      if (nowIndicator) {
        nowIndicator
          .attr('x', function () {
            return xScale(Date.now());
          });
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
  var setClickFunction = function (xScale, dimensions, clickFn) {
    var clicked = function () {
      // Check whether user is dragging instead of clicking
      if (!d3.event.defaultPrevented) {
        clickFn(d3.event, xScale, dimensions);
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
      var barHeight = initialHeight - newDimensions.padding.top -
                      newDimensions.padding.bottom + newDimensions.bars,
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
            return xScale(d[0]) - 0.5 * barWidth;
          });
      } else {
        rectangles.transition()
          .duration(Timeline.prototype.transTime)
          .attr("height", function (d) {return yScale(d[1]); })
          .attr("y", function (d) {
            return newHeight - yScale(d[1]);
          })
          .attr("x", function (d) {
            return xScale(d[0]) - 0.5 * barWidth;
          });
      }
    }
  };

  /**
   * @function
   * @summary update now indicator element
   *
   * @param {object} nowIndicator - D3 selection.
   * @param {object} xScale - D3 scale.
   * @param {object} dimensions - timeline dimensions object.
   */
  var updateNowElement = function (nowIndicator, xScale, dimensions) {
    var width = Timeline.prototype._getWidth(dimensions),
        height = Timeline.prototype._getHeight(dimensions);

    nowIndicator
     .attr('height', height)
     .attr('width', width)
     .attr('x', function () {
        return xScale(Date.now());
      });
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
   *     TODO: should maybe be style? check with branch Fritz styling events.
   *     properties.color: <color code>,
   *     geometry.coordinates: [lat, lon]}]
   * @param {int} order - Order of data (which level to draw in timeline).
   * @param {string} slug - slug of event series.
   */
  var drawLineElements = function (
    svg, dimensions, xScale, yScale, data, order, slug) {

    var xOneFunction = function (d) {
      return xScale(d.properties.timestamp_end);
    };
    var xTwoFunction = function (d) {
      return xScale(d.properties.timestamp_start);
    };
    var yFunction = function (d) { return yScale(order); };
    // TODO: get color from backend
    var colorFunction = function (d) { return "#F00"; };
    var dFunction = function (d) {
      // Draws a small line from the end of the event to start
      var path =
        "M " + xOneFunction(d) + " " + yFunction(d)
        + " L " + (xTwoFunction(d) + 0.5) + " " + yFunction(d);
      return path;
    };
    var initialDFunction = function (d) {
      // Draws a mimimal line from end to just next to the end to create a
      // circle + 0.5 is to prevent flickering in browsers when transitioning
      var path =
        "M " + xOneFunction(d) + " " + yFunction(d)
        + " L " + (xOneFunction(d) + 0.5) + " " + yFunction(d);
      return path;
    };
    var splitTranstime = Timeline.prototype.transTime / 2;

    // if data exists, check if group is available for this series and create
    // if no data, remove lines
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
      lines = group.selectAll("path")
        .data(data, function  (d) { return d.properties.id; });
    } else if (data === undefined) {
      // if no data is defined, remove all groups
      var groups = svg.select("g").select("#circle-group").selectAll("g");
      groups.remove();

      return;
    }

    // UPDATE
    // Update old elements as needed.
    lines.transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("stroke", colorFunction)
      .attr("d", dFunction);

    // ENTER
    // Create new elements as needed.
    lines.append("g");
    lines.enter().append("path")
      .attr("class", "event selected")
      .attr("stroke", colorFunction)
      .attr("d", initialDFunction)
      .attr("stroke-linecap", "round")
      .attr("stroke-opacity", 0)
      .attr("stroke-width", 0)
    .transition()
      .delay(splitTranstime)
      .duration(splitTranstime)
      .attr("stroke-width", 10)
      .attr("stroke-opacity", 0.8)
    .transition()
      .delay(Timeline.prototype.transTime)
      .duration(splitTranstime)
      .attr("d", dFunction);

    // EXIT
    // Remove old elements as needed.
    lines.exit()
      .transition()
      .delay(0)
      .duration(splitTranstime)
      .attr("d", initialDFunction)
    .transition()
      .delay(splitTranstime)
      .duration(splitTranstime)
      .attr("stroke-width", 0)
      .style("fill-opacity", 0)
      .remove();

    return lines;
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
    if (data.length > 0) {
      barWidth = xScale(data[1][0]) - xScale(data[0][0]);
    } else {
      barWidth = 0;
    }

    // // UPDATE
    // // Update old elements as needed.
    bars.transition()
      .duration(Timeline.prototype.transTime)
      .attr("x", function (d) { return xScale(d[0]) - 0.5 * barWidth; })
      .attr('width', barWidth)
      .attr("height", function (d) { return yScale(d[1]); })
      .attr("y", function (d) { return height - yScale(d[1]); });

    // ENTER
    // Create new elements as needed.
    bars.enter().append("rect")
      .attr("class", "bar-timeline")
      .attr("x", function (d) { return xScale(d[0]) - 0.5 * barWidth; })
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
   * @summary Returns a d3 scale to place events vertically in lines above each
   * other.
   *
   * @param  {int} iniH initial height of the timeline in px.
   * @param  {object} dims current dimensions of the timeline.
   */
  var makeEventsYscale = function (iniH, dims) {
    var yScale = function (order) {
      var padding = dims.events / 2;
      var fromTop = padding + dims.padding.top + dims.events * (order - 1);
      return fromTop;
    };
    return yScale;
  };

  return Timeline;

}]);
