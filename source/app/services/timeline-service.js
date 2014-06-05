/**
 * Service to create and update a timeline. Currently used by the timeline-directive.
 *
 * Inject "Timeline" and call new timeline(<args>) to create a timeline. Currently the timeline
 * supports circles (events), vertical bars (rain intensity) and a brush (selection tool). 
 * The user may interact with the app through click, zoom and brush functions. Brush and 
 * zoom is mutually exclusive. When you add brush functionality, zoom functionality has to 
 * be removed manually by calling removeZoomListener() and vice versa. Zooming is prefered above
 * clicking: when a user zooms through dragging, no click is fired.
 *
 * Everything in the timeline is animated for 500 milliseconds. To add new elements to the 
 * timeline, make sure the elements are updated on zoom, brush and resize. The timeline resizes
 * before elements are added and after elements are removed. Therefore new and old dimensions 
 * need to be compared to delay the resize of elements the same amount as the canvas.
 */
app.factory("Timeline", [ function () {

  // The timeline
  var svg;
  var initialHeight;

  // D3 components
  var xScale; // The only d3 scale for placement on the x axis within the whole timeline. Is only
              // updated when zoomTo is called.
  var xAxis;
  var brush;

  // Interaction functions
  var clicked;
  var zoomed;
  var brushed;

  // Timeline elements
  var noDataIndicator;
  var nowIndicator;
  var brushg;
  var circles; // events
  var bars; // rain intensity

  /**
   * Constructor
   * 
   * @param {SVG element}         element svg element for the timeline.
   * @param {object} dimensions   object containing, width, height, height per line of events, height
   *                              per line of bars and an object containing top, bottom, left and right
   *                              padding. All values in px.
   * @param {epoch ms} start      begin value in milliseconds from epoch.
   * @param {epoch ms} end        end value in milliseconds from epoch.
   * @param {object} interaction  optional object containing callback functions for zoom, click and brush
   *                              interaction with the rest of the app. 
   */
  function Timeline(element, dimensions, start, end, interaction) {
    this.dimensions = angular.copy(dimensions);
    initialHeight = dimensions.height;
    svg = createCanvas(element, this.dimensions);
    var width = dimensions.width - dimensions.padding.left - dimensions.padding.right;
    xScale = makeScale({min: new Date(start), max: new Date(end)},
                            {min: 0, max: width},
                            { type: 'time' });
    xAxis = makeAxis(xScale, {orientation: "bottom", ticks: 5});
    drawAxes(svg, xAxis);
    if (interaction) {
      if (interaction.zoomFn) {
        zoomed = setZoomFunction(svg, this.dimensions, xScale, xAxis, interaction.zoomFn);
      }
      if (interaction.clickFn) {
        clicked = setClickFunction(xScale, this.dimensions, interaction.clickFn);
      }
      if (interaction.brushFn) {
        brushed = setBrushFunction(xScale, interaction.brushFn);
      }
    }
  }

  Timeline.prototype = {

    constructor: Timeline,

    // TODO: create real noDataIndicator, this is just legacy code
    addNoDataIndicator: function () {
      var width = this.dimensions.width - this.dimensions.padding.left - this.dimensions.padding.right,
      height = this.dimensions.height - this.dimensions.padding.top - this.dimensions.padding.bottom;

      noDataIndicator = this.svg.select('g').append('rect')
        .attr('height', height)
        .attr('width', width)
        .attr('id', 'nodata')
        .attr('x', -4000) // make sure nodata bar is invisible at first
        .style('fill', 'url(#lightstripe)');
    },

    // TODO: remove nowIndicator and add it to the brush
    addNowIndicator: function () {
      var height = this.dimensions.height - this.dimensions.padding.top - this.dimensions.padding.bottom;

      // Create line for the timeState.at just out of sight
      nowIndicator = svg.select('g').append('line')
        .attr('class', 'now-indicator')
        .attr('x1', - this.dimensions.padding.left - 5)
        .attr('x2', - this.dimensions.padding.left - 5)
        .attr('y1', height)
        .attr('y2', 0);
    },

    addClickListener: function () {
      svg.on("click", clicked);
    },

    /**
     * Draws a brush from start to end
     */
    drawBrush: function (start, end) {
      brush = d3.svg.brush().x(xScale);
      brush.on("brush", brushed);

      brushg = svg.select('g').append("g")
        .attr("class", "brushed");
      var height = this.dimensions.height - this.dimensions.padding.top - this.dimensions.padding.bottom;
      brushg.call(brush.extent([new Date(start), new Date(end)]));
      brushg.selectAll("rect")
        .attr("height", height)
        .selectAll("rect")
          .transition()
          .delay(500)
          .duration(500)
          .attr("height", height);
      brushed();
    },

    removeBrush: function () {
      if (brushg) {
        brushg.remove();
      }
      svg.selectAll(".selected").classed("selected", false);
    },

    /**
     * Resizes the timeline.
     *
     * Makes a deep copy of the old dimensions,
     * updates canvas,
     * updates all elements,
     * redraws the axis.
     * 
     * @param {object} dimensions   object containing, width, height, height per line of events, height
     *                              per line of bars and an object containing top, bottom, left and right
     *                              padding. All values in px.
     */
    resize: function (dimensions) {
      var oldDimensions = angular.copy(this.dimensions);
      this.dimensions = dimensions;
      this.updateElements(oldDimensions);
      svg = updateCanvas(svg, oldDimensions, this.dimensions);
      drawAxes(svg, xAxis);
    },

    /**
     * Update all elements to accomadate new dimensions.
     * 
     * @param  {dimensions object} oldDimensions copy of the old dimensions
     */
    updateElements: function (oldDimensions) {
      if (circles) {
        updateCircleElements(circles, xScale);
      }
      if (bars && oldDimensions) {
        updateRectangleElements(bars, xScale, oldDimensions, this.dimensions);
      }
      if (noDataIndicator) {
        updateNoDataElement(noDataIndicator, xScale, this.dimensions);
      }
      if (nowIndicator) {
        this.updateNowElement();
      }
      if (brushg) {
        updateBrush(brushg, brush, oldDimensions, this.dimensions);
      }
    },

    /**
     * Updates the brush's extent and calls the brush function
     */
    updateBrushExtent: function (start, end) {
      brushg
        .call(brush.extent([new Date(start), new Date(end)]));
      brushed();
    },

    // TODO: remove nowIndicator and add it to the brush
    updateNowElement: function (now) {
      var height = this.dimensions.height - this.dimensions.padding.top - this.dimensions.padding.bottom;
      nowIndicator
        .attr('x1', - this.dimensions.padding.left - 5)
        .attr('x2', - this.dimensions.padding.left - 5)
        .attr('y1', height);
    },

    /**
     * Updates, adds or removes all circles in the data object
     *
     * @param {array} data array of objects [{properties.timestamp: timestamp, 
     *                                        id: <id>,
     *                                        color: <color code>,
     *                                        geometry.coordinates: [lat, lon],
     *                                        event_order: <int specifying the line of events>}]
     */
    drawCircles: function (data) {
      var yScale = makeEventsYscale(initialHeight, this.dimensions);
      circles = drawCircleElements(
        svg,
        this.dimensions,
        data,
        xScale,
        yScale
      );
    },

    /**
     * Updates, adds or removes all bars in the data object
     *
     * @param {array} data array of arrays [[bar_timestamp, bar_height]]
     */
    drawBars: function (data) {
      var height = initialHeight - this.dimensions.padding.top - this.dimensions.padding.bottom + this.dimensions.bars;

      var y = maxMin(data, '1');
      var options = {scale: 'linear'};
      var yScale = makeScale(
        y,
        {min: 0, max: height},
        options);
      bars = drawRectElements(svg, this.dimensions, data, xScale, yScale);
    },

    removeBars: function () {
      drawRectElements(svg, this.dimensions, []);
      bars = undefined;
    },

    /**
     * Takes a leaflet bounds object and filters all circles whether their geographic
     * location falls within the bounds. Candidate to be refactored, since this
     * service is specific to events.
     * 
     * @param  {leaflet bounds object} bounds to filter events with
     */
    drawEventsContainedInBounds: function (bounds) {
      var latLng = [];
      d3.selectAll("circle").classed("hidden", true);
      d3.selectAll("circle")
        .classed("selected", function (d) {
          latLng[0] = d.geometry.coordinates[1];
          latLng[1] = d.geometry.coordinates[0];
          var contained = bounds.contains(latLng);
          // Some book keeping to count
          d.inSpatExtent = contained;
          return contained;
        });
      var selected = d3.selectAll("circle.selected");
      selected.classed("hidden", false);
    },

    /**
     * Update domain of scale and call functions to update timeline to new
     * scale.
     * 
     * @param  {int} start in ms since epoch
     * @param  {int} end   in ms since epoch
     */
    zoomTo: function (start, end) {
      xScale.domain([new Date(start), new Date(end)]);
      xAxis = makeAxis(xScale, {orientation: "bottom", ticks: 5});
      this.updateElements();
      drawAxes(svg, xAxis);
      this.addZoomListener();
    },

    addZoomListener: function () {
      svg.call(d3.behavior.zoom()
        .x(xScale)
        .on("zoom", zoomed)
      );
    },

    /**
     * Thorougly removes zoom listeners.
     */
    removeZoomListener: function () {
      svg.call(d3.behavior.zoom()
        .x(xScale)
        .on("zoom", null)
      );
      svg
        .on("zoom", null)
        .on("mousedown.zoom", null)
        .on("touchstart.zoom", null)
        .on("touchmove.zoom", null)
        .on("touchend.zoom", null);
    }
  };

  var createCanvas = function (svg, dimensions) {
    var width = dimensions.width - dimensions.padding.left - dimensions.padding.right,
        height = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;

    svg.attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .style("margin-top", dimensions.padding.top)
      .append("g")
        .attr("transform", "translate(" + dimensions.padding.left + ", 0)")
        .append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "plot-temporal");
    // Create element for axis
    svg.select('g').append("g")
      .attr('class', 'x axis')
      .attr('id', 'xaxis')
      .attr("transform", "translate(0 ," + height + ")");
    // Create group for rain bars
    svg.select('g').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'rain-bar');
    // Create group for circles
    svg.select('g').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'circle-group');

    return svg;

  };

  var updateCanvas = function (svg, oldDims, newDims) {
    var width = newDims.width - newDims.padding.left - newDims.padding.right;
    var height = newDims.height - newDims.padding.top - newDims.padding.bottom;

    if (newDims.height < oldDims.height) {
      svg.transition()
        .duration(500)
        .delay(500)
        .attr('height', newDims.height)
        .attr('width', newDims.width)
        .select("g")
        .attr("transform", "translate(" + newDims.padding.left + ", 0)")
        .select('#xaxis')
        .attr("transform", "translate(0 ," + height + ")");
    } else {
      svg.transition()
        .duration(500)
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

  var setZoomFunction = function (svg, dimensions, xScale, xAxis, zoomFn) {
    var zoomed = function () {
      drawAxes(svg, xAxis);
      if (circles) {
        circles.attr("cx", function (d) {
          return Math.round(xScale(d.properties.timestamp));
        });
      }
      if (bars) {
        var barData = bars.data();
        var newWidth = xScale(barData[1][0]) - xScale(barData[0][0]);
        bars
          .attr("x", function (d) { return xScale(d[0]) - 0.5 * newWidth; })
          .attr('width', newWidth);
      }
      if (nowIndicator) {
        nowIndicator
          .attr('x1', xScale(scope.timeState.at) || graph.margin.left - 5)
          .attr('x2', xScale(scope.timeState.at) || graph.margin.left - 5);
      }
      if (noDataIndicator) {
        var year2014 = 1388534400000; // in msecs, since epoch
        var x = xScale(year2014);
        noDataIndicator
          .attr('x', function (d) {
            return Math.round(x - noDataIndicator.attr('width'));
          });
      }
      if (zoomFn) {
        zoomFn(xScale);
      }
    };
    return zoomed;
  };

  var setBrushFunction = function (xScale, brushFn) {
    var brushed = function () {
      var s = brush.extent();
      if (circles) {
        circles.classed("selected", function (d) {
          var t = new Date(d.properties.timestamp);
          return s[0] <= t && t <= s[1];
        });
      }
      if (bars) {
        bars.classed("selected", function (d) {
          var t = new Date(d[0]);
          return s[0] <= t && t <= s[1];
        });
      }
      brushFn(brush);
    };
    return brushed;
  };

  var updateBrush = function (brushg, brush, oldDim, newDim) {
    brushed();
    var height = newDim.height - newDim.padding.top - newDim.padding.bottom;
    var delay = 0;
    if (oldDim.height > newDim.height) {
      delay = 500;
    }
    brushg.selectAll("rect")
      .transition()
      .duration(500)
      .delay(delay)
      .attr("height", height)
        .selectAll("rect")
          .transition()
          .delay(500)
          .duration(500)
          .attr("height", height);
  };

  var setClickFunction = function (xScale, dimensions, clickFn) {
    var clicked = function () {
      // Check whether user is dragging instead of clicking
      if (!d3.event.defaultPrevented) {
        clickFn(d3.event, xScale, dimensions);
      }
    };
    return clicked;
  };

  var updateCircleElements = function (circles, xScale) {
    var xFunction = function (d) { return Math.round(xScale(d.properties.timestamp)); };

    // UPDATE
    // Update old elements as needed.
    circles.attr("cx", xFunction);
  };

  var updateRectangleElements = function (rectangles, xScale, oldDimensions, newDimensions) {
    // UPDATE
    // Update old elements as needed.
    if (rectangles[0].length > 0) {
      var barHeight = initialHeight - newDimensions.padding.top - newDimensions.padding.bottom + newDimensions.bars;
      var y = maxMin(rectangles.data(), '1');
      var options = {scale: 'linear'};
      var newHeight = newDimensions.height - newDimensions.padding.top - newDimensions.padding.bottom;
      var oldHeight = oldDimensions.height - oldDimensions.padding.top - oldDimensions.padding.bottom;
      var heightDiff = newHeight - oldHeight;
      var yScale = makeScale(
        y,
        {min: 0, max: barHeight},
        options);
      var barWidth = Number(rectangles.attr('width'));
      if (heightDiff < 0) {
        rectangles.transition()
          .duration(500)
          .delay(500)
          .attr("y", function (d) {
            return newHeight - yScale(d[1]);
          })
          .attr("x", function (d) {
            return xScale(d[0]) - 0.5 * barWidth;
          });
      } else {
        rectangles.transition()
          .duration(500)
          .attr("y", function (d) {
            return newHeight - yScale(d[1]);
          })
          .attr("x", function (d) {
            return xScale(d[0]) - 0.5 * barWidth;
          });
      }
    }
  };

  var updateNoDataElement = function (noDataIndicator, xScale, dimensions) {
    var width = dimensions.width - dimensions.padding.left - dimensions.padding.right,
      height = dimensions.height - dimensions.padding.top - dimensions.padding.bottom,
      year2014 = 1388534400000, // in msecs, since epoch
      x = xScale(year2014);

    noDataIndicator
      .attr('height', height)
      .attr('width', width)
      .attr('x', function (d) {
        return Math.round(x - noDataIndicator.attr('width'));
      });
  };

  var updateNowElement = function (nowIndicator, xScale, dimensions, now) {
    nowIndicator
      .attr('x1', xScale(now) || dimensions.padding.left - 5)
      .attr('x2', xScale(now) || dimensions.padding.left - 5);
  };

  var drawCircleElements = function (svg, dimensions, data, xScale, yScale) {
    var xFunction = function (d) { return xScale(d.properties.timestamp); };
    var yFunction = function (d) { return yScale(d.event_order); };
    var colorFunction = function (d) { return d.color; };
    // DATA JOIN
    // Join new data with old elements, based on the id value.
    circles = svg.select('g').select('#circle-group').selectAll("circle")
        .data(data, function  (d) { return d.id; });

    // UPDATE
    // Update old elements as needed.
    circles.attr("class", "event")
      .transition()
      .delay(500)
      .duration(500)
      .attr("fill", colorFunction)
      .attr("cy", yFunction)
      .attr("cx", xFunction);

    // ENTER
    // Create new elements as needed.
    circles.enter().append("circle")
      .attr("cx", xFunction)
      .attr("class", "event")
      .attr("cy", yFunction)
      .attr("fill", colorFunction)
      .attr("r", 5)
      .attr("fill-opacity", 0)
      .transition()
      .delay(500)
      .duration(500)
      .attr("fill-opacity", 1);

    // EXIT
    // Remove old elements as needed.
    circles.exit()
      .transition()
      .delay(0)
      .duration(500)
      .attr("cy", 0)
      .attr("cx", xFunction)
      .style("fill-opacity", 1e-6)
      .remove();

    return circles;
  };


  var drawRectElements = function (svg, dimensions, data, xScale, yScale) {
    var height = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;
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
      .duration(500)
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
      .delay(500)
      .duration(500)
      .attr("height", function (d) { return yScale(d[1]); })
      .attr("y", function (d) { return height - yScale(d[1]); });

    // EXIT
    // Remove old elements as needed.
    bars.exit()
      .transition()
      .duration(500)
      .attr("y", height)
      .attr("height", 0)
      .remove();

    var barsEl = svg.select("g").select('#rain-bar').node();
    barsEl.parentNode.insertBefore(barsEl, barsEl.parentNode.firstChild);

    return bars;
  };

  var maxMin = function (data, key) {
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
  };

  var makeScale = function (minMax, range, options) {
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
  };

  var makeEventsYscale = function (iniH, dims) {
    var yScale = function (order) {
      var padding = dims.events / 2;
      var fromTop = padding + dims.padding.top + dims.events * (order - 1);
      return fromTop;
    };
    return yScale;
  };


  var makeAxis = function (scale, options) {
    // Make an axis for d3 based on a scale
    var axis;
    if (options.ticks) {
      axis = d3.svg.axis()
              .scale(scale)
              .orient(options.orientation)
              .ticks(options.ticks);
    } else {
      axis = d3.svg.axis()
            .scale(scale)
            .orient(options.orientation)
            .ticks(5);
    }
    return axis;
  };

  /**
   * Draws the given axis in the given svg
   */
  var drawAxes = function (svg, xAxis) {
    svg.select('g').select('#xaxis')
      .call(xAxis);
  };

  return Timeline;

}]);
