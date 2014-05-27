/**
 * Service to create and update the timeline.
 */
app.factory("Timeline", [ function () {

  // The timeline
  var svg;

  // D3 components
  var xScale;
  var xAxis;

  // Timeline elements
  var noDataIndicator;
  var nowIndicator;
  var brush;
  var circles;
  var bars;

  // Constructor function  
  function Timeline(start, end, dimensions, element, zoomFn) {
    this.dimensions = dimensions;
    svg = createCanvas(element, this.dimensions);
    var width = dimensions.width - dimensions.padding.left - dimensions.padding.right;
    xScale = makeScale({min: new Date(start), max: new Date(end)},
                            {min: 0, max: width},
                            { type: 'time' });
    xAxis = makeAxis(xScale, {orientation: "bottom", ticks: 5});
    drawAxes(svg, xAxis);
    addZoom(svg, this.dimensions, xScale, xAxis, zoomFn);
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
    drawBrush: function () {

    },
    removeBrush: function () {

    },
    resize: function (dimensions) {
      this.dimensions = dimensions;
      svg = updateCanvas(svg, this.dimensions);
      drawAxes(svg, xAxis);

      if (noDataIndicator) {
        updateRectangleElementHeight(noDataIndicator, this.dimensions);
      }
      if (nowIndicator) {
        updateLineElementHeight(nowIndicator, this.dimensions);
      }
      if (brush) {
        updateRectangleElementHeight(brush, this.dimensions);
      }
    },
    drawCircles: function (data, nLines, colors, xKey, yKey) {
      var lowestCircleLine = 20; // lowest line is drawn 20px from the bottom
      if (bars) {
        lowestCircleLine = 80;
      }
      var yScale = makeScale(
        {
          min: 1,
          max: nLines
        },
        {
          min: this.dimensions.height - this.dimensions.padding.top,
          max: lowestCircleLine
        },
        {scale: 'linear'}
      );

      var colorScale = makeScale(
        null,
        null,
        { scale: 'ordinal', colors: colors}
      );

      circles = drawCircleElements(
        svg,
        this.dimensions,
        data,
        xScale,
        yScale,
        colorScale,
        xKey,
        yKey
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
        //.style("transform", "translate3d(" + margin.left + "," + margin.top + ")")
        .append("rect")
          .attr("width", width)
          .attr("height", height)
          // .style("fill", "url(#lightstripe)")
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
    return svg;
  };

  var addZoom = function (svg, dimensions, xScale, xAxis, zoomFn) {
    svg.call(d3.behavior.zoom()
      .x(xScale)
      .on("zoom", function () {
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
          nowIndicator.attr('x1')
          svg.select('.now-indicator')
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
      })
    );
  };

  var drawCircleElements = function (svg, dimensions, data, xScale, yScale, colorScale, xKey, yKey) {
    // Shift halve a pixel for nice and crisp rendering
    var xFunction = function (d) { return Math.round(xScale(d.properties[xKey])) + 0.5; };
    var yFunction = function (d) { return yScale(d[yKey]) + 0.5; };
    var colorFunction = function (d) { return d.color; };
    // DATA JOIN
    // Join new data with old elements, based on the id value.
    circles = svg.select('g').selectAll("circle")
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

  return Timeline;

}]);