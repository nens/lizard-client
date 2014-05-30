/**
 * Service to create and update the timeline.
 */
app.factory("Timeline", [ function () {

  // The timeline
  var svg;
  var initialHeight;

  // D3 components
  var xScale;
  var xAxis;
  var zoom;
  var brush;

  // Timeline elements
  var noDataIndicator;
  var nowIndicator;
  var brushg;
  var circles;
  var bars;

  // Constructor function  
  function Timeline(element, dimensions, start, end, zoomFn, clickFn) {
    this.dimensions = dimensions;
    initialHeight = dimensions.height;
    svg = createCanvas(element, this.dimensions);
    var width = dimensions.width - dimensions.padding.left - dimensions.padding.right;
    xScale = makeScale({min: new Date(start), max: new Date(end)},
                            {min: 0, max: width},
                            { type: 'time' });
    xAxis = makeAxis(xScale, {orientation: "bottom", ticks: 5});
    drawAxes(svg, xAxis);
    zoom = createZoomListener(svg, this.dimensions, xScale, xAxis, zoomFn);
    this.addZoomListener();
    addClickListener(svg, xScale, this.dimensions, clickFn);
  }

  Timeline.prototype = {

    constructor: Timeline,

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

    drawBrush: function (start, end, brushFn) {
      var brush = d3.svg.brush().x(xScale);
      brush.on("brush", function () {
        var extent = brushg.select('.extent');
        var s = [xScale.invert(Number(extent.attr('x'))), xScale.invert(Number(extent.attr('x')) + Number(extent.attr('width')))];
        if (circles) {
          circles.classed("selected", function (d) {
            var t = new Date(d.properties.timestamp);
            return s[0] <= t && t <= s[1];
          });
        }
        if (bars) {
          bars.classed("selected", function (d) {
            var t = new Date(d[0]);
            return s[0] <= t && t <= s[1]; });
        }
        brushFn(brush);
      });

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
      brushFn(brush);
    },

    removeBrush: function () {
      if (brushg) {
        brushg.remove();
      }
      svg.classed("selecting", false);
      d3.selectAll('.event').classed("selected", false);
    },

    resize: function (dimensions, now, anStart, anEnd) {
      this.dimensions = dimensions;
      svg = updateCanvas(svg, this.dimensions);
      drawAxes(svg, xAxis);
      this.updateElements(now, anStart, anEnd);
    },

    updateElements: function (now, anStart, anEnd) {
      if (circles) {
        updateCircleElements(circles, xScale);
      }
      if (bars) {
        updateRectangleElements(bars, xScale, this.dimensions);
      }
      if (noDataIndicator) {
        updateNoDataElement(noDataIndicator, xScale, this.dimensions);
      }
      if (nowIndicator && now) {
        this.updateNowElement(now);
      }
      if (brush) {
        updateBrush(anStart, anEnd, brushg, brush, this.dimensions);
      }
    },

    updateNowElement: function (now) {
      var height = this.dimensions.height - this.dimensions.padding.top - this.dimensions.padding.bottom;
      nowIndicator
        .attr('x1', - this.dimensions.padding.left - 5)
        .attr('x2', - this.dimensions.padding.left - 5)
        .attr('y1', height);
    },

    drawCircles: function (data, nLines, colors) {
      var lowestCircleLine = 30; // lowest line is drawn 20px from the bottom
      if (bars) {
        lowestCircleLine = 80;
      }
      var iniH = initialHeight;
      var dims = this.dimensions;
      var yScale = function (order) {
        var fromTop = (iniH - 26) / 2 + dims.events * (order - 1);
        return fromTop;
      };
      circles = drawCircleElements(
        svg,
        this.dimensions,
        data,
        xScale,
        yScale
      );
    },

    drawBars: function (data) {
      var height = this.dimensions.height - this.dimensions.padding.top - this.dimensions.padding.bottom;

      var y = maxMin(data, '1');
      var options = {scale: 'linear'};
      var yScale = makeScale(
        y,
        {min: height, max: 0},
        options);
      bars = drawRectElements(svg, this.dimensions, data, xScale, yScale);
    },

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

    zoomTo: function (start, end) {
      var width = this.dimensions.width - this.dimensions.padding.left - this.dimensions.padding.right;
      xScale = makeScale(
        {min: new Date(start), max: new Date(end)},
        {min: 0, max: width},
        { type: 'time' });
      xAxis = makeAxis(xScale, {orientation: "bottom", ticks: 5});
      this.updateElements();
      drawAxes(svg, xAxis);
      this.addZoomListener();
    },

    addZoomListener: function () {
      svg.call(d3.behavior.zoom()
        .x(xScale)
        .on("zoom", zoom)
      );
    },

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

  var updateCanvas = function (svg, dimensions) {
    var width = dimensions.width - dimensions.padding.left - dimensions.padding.right;
    var height = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;

    svg.transition()
      .duration(500)
      .delay(500)
      .attr('height', dimensions.height)
      .select("g")
      .attr("transform", "translate(" + dimensions.padding.left + ", 0)")
      .select('g')
      .attr("transform", "translate(0 ," + height + ")");
    svg.select("g").select("rect")
      .attr("height", height);
    // Update rain bars
    svg.select('g').select('#rain-bar')
      .attr('height', height);
    // Update circles
    svg.select('g').select('#circle-group')
      .attr('height', height);
    return svg;
  };

  var createZoomListener = function (svg, dimensions, xScale, xAxis, zoomFn) {
    var zoom = function () {
      drawAxes(svg, xAxis);
      if (circles) {
        circles.attr("cx", function (d) {
          return Math.round(xScale(d.properties.timestamp));
        });
      }
      if (bars) {
        var newWidth = bars.attr('width') * d3.event.scale;
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
    return zoom;
  };

  /**
   * Click handler to set scope.timeState.at to to timestamp where clicked
   * in timeline.
   *
   * Is eg used by dynamic raster functionality to get image for time
   * clicked.
   *
   */
  var addClickListener = function (svg, xScale, dimensions, clickFn) {
    svg.on("click", function () {
      // Check whether user is dragging instead of clicking
      if (!d3.event.defaultPrevented) {
        clickFn(xScale, dimensions);
      }
    });
  };

  var updateCircleElements = function (circles, xScale) {
    var xFunction = function (d) { return Math.round(xScale(d.properties.timestamp)); };

    // UPDATE
    // Update old elements as needed.
    circles.attr("cx", xFunction);
  };

  var updateRectangleElements = function (rectangles, xScale) {
    // UPDATE
    // Update old elements as needed.
    var barWidth = rectangles.attr('width');
    rectangles.attr("x", function (d) { return xScale(d[0]) - 0.5 * barWidth; });
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
    var xFunction = function (d) { return Math.round(xScale(d.properties.timestamp)); };
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

    var zero = yScale(0);

    // UPDATE
    // Update old elements as needed.
    bars.transition()
      .duration(500)
      .attr("x", function (d) { return xScale(d[0]) - 0.5 * barWidth; })
      .attr('width', barWidth)
      .delay(500)
      .attr("y", function (d) { return yScale(d[1]); })
      .attr("height", function (d) { return height - yScale(d[1]); });

    // ENTER
    // Create new elements as needed.
    bars.enter().append("rect")
      .attr("class", "bar-timeline")
      .attr("x", function (d) { return xScale(d[0]) - 0.5 * barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", zero)
      .attr("height", 0)
      .transition()
      .duration(500)
      .attr("y", function (d) { return yScale(d[1]); })
      .attr("height", function (d) { return height - yScale(d[1]); });

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

  var updateBrush = function (start, end, brushg, brush, dimensions) {
    var height = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;
    brush.extent([new Date(start), new Date(end)]);
    brushg.selectAll("rect")
        .transition()
        .delay(500)
        .duration(500)
        .attr("height", height)
        .selectAll("rect")
          .transition()
          .delay(500)
          .duration(500)
          .attr("height", height);
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

  window.onresize = function () {
    this.resize();
  };

  return Timeline;

}]);