'use strict';

// Timeline for lizard.
app.controller('TimelineDirCtrl', function ($scope) {




  this.scale = function (minMax, range, options) {
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

  this.makeAxis = function (scale, options) {
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
   * Draws the given axis in the given graph
   */
  this.drawAxes = function (graph, xAxis) {
    graph.svg.select('g').select('#xaxis')
      .call(graph.xAxis);
  };

  this.drawCircles = function (svg, xScale, yScale, colorScale, xKey, yKey, data) {
    // Shift halve a pixel for nice and crisp rendering
    var xFunction = function (d) { return Math.round(xScale(d.properties[xKey])) + 0.5; };
    var yFunction = function (d) { return yScale(d[yKey]) + 0.5; };
    var colorFunction = function (d) { return d.color; };
    // DATA JOIN
    // Join new data with old elements, based on the id value.
    var circles = svg.select('g').selectAll("circle")
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

    // Add click listener
    circles.on('click', function (d) {
      $scope.box.type = 'aggregate';
      $scope.box.content.eventValue = d;
      $scope.$apply();
    });
  };

  this.drawRainIntensity = function (data, graph) {
    // Join new data with old elements, based on the timestamp.
    var bar = graph.svg.select("g").select('#rain-bar').selectAll('.bar-timeline')
        .data(data, function  (d) { return d[0]; });

    var barWidth;
    if (data.length > 0) {
      barWidth = graph.xScale(data[1][0]) - graph.xScale(data[0][0]);
    } else {
      barWidth = 0;
    }
    var y = maxMin(data, '1');
    var yRange = {min: graph.height, max: 0};
    var options = {scale: 'linear'};
    var yScale = d3.scale.linear().domain([y.min, y.max]).range([yRange.min, yRange.max]);
    var zero = yScale(0);

    // UPDATE
    // // Update old elements as needed.
    bar.transition()
      .duration(500)
      .attr("x", function (d) { return graph.xScale(d[0]) - 0.5 * barWidth; })
      .attr('width', barWidth)
      .delay(500)
      .attr("y", function (d) { return yScale(d[1]); })
      .attr("height", function (d) { return graph.height - yScale(d[1]); });

    // ENTER
    // Create new elements as needed.
    bar.enter().append("rect")
      .attr("class", "bar-timeline")
      .attr("x", function (d) { return graph.xScale(d[0]) - 0.5 * barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", zero)
      .attr("height", 0)
      .transition()
      .duration(500)
      .attr("y", function (d) { return yScale(d[1]); })
      .attr("height", function (d) { return graph.height - yScale(d[1]); });

    // EXIT
    // Remove old elements as needed.
    bar.exit()
      .transition()
      .duration(500)
      .attr("y", graph.height)
      .attr("height", 0)
      .remove();

    var barsEl = graph.svg.select("g").select('#rain-bar').node();
    barsEl.parentNode.insertBefore(barsEl, barsEl.parentNode.firstChild);
  };

  this.drawEventsContainedInBounds = function (bounds) {
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
  };

  this.brushmove = function () {
    var s = brush.extent();
    var sSorted = [s[0].getTime(), s[1].getTime()].sort();
    $scope.timeState.animation.start = sSorted[0];
    $scope.timeState.animation.end = sSorted[1];
    $scope.timeState.at = (sSorted[0] + sSorted[1]) / 2;
    if (!$scope.timeState.animation.playing && !$scope.$$phase) {
      $scope.$apply();
    }
  };

  var brush = null;
  this.createBrush = function (graph) {
    brush = d3.svg.brush().x(graph.xScale)
      .on("brush", this.brushmove);
    this.brushg = graph.svg.select('g').append("g")
      .attr("class", "brushed")
      .call(brush);
    this.brushg.selectAll("rect")
      .attr("height", graph.height);
    return brush;
  };

  this.updateBrush = function (height) {
    if (this.brushg) {
      this.brushg.selectAll("rect")
        .transition()
        .delay(500)
        .duration(500)
        .attr("height", height);
      this.brushg.call(brush);
    }
  };

  this.removeBrush = function (svg) {
    if (this.brushg) {
      this.brushg.remove();
    }
    svg.classed("selecting", false);
    d3.selectAll('.bar').classed("selected", false);
  };

  /**
   * Shows the line element indicating timeState.at.
   * 
   * @param  {graph object} graph contains the svg and a d3 scale object
   * @param  {now} now   epoch timestamp in ms
   */
  this.drawNow = function (graph, now) {
    var line = graph.svg.select('g').select('.now-indicator');
    line
      .transition()
      .duration(300)
      .ease('in-out')
      .attr('x1', graph.xScale(now))
      .attr('x2', graph.xScale(now))
      .attr('y1', graph.height)
      .attr('y2', 0);
  };

  /**
   * Hides the now element by moving it out of sight to the left.
   *
   * @param  {graph object} graph containing the svg.
   */
  this.hideNow = function (graph) {
    var line = graph.svg.select('g').select('.now-indicator');
    line
      .attr('x1', - graph.margin.left - 5)
      .attr('x2', - graph.margin.left - 5)
      .attr('y1', graph.height)
      .attr('y2', 0);
  };

  /**
   * Updates the height of the now indicator line when the 
   * timeline is rescaled.
   * 
   * @param  {graph object} graph contains the svg and a d3 scale object
   * @param  {now} now   epoch timestamp in ms
   */
  this.updateNow = function (graph, now) {
    var line = graph.svg.select('g').select('.now-indicator');
    line
      .transition()
      .delay(500)
      .duration(500)
      .attr('x1', graph.xScale(now))
      .attr('x2', graph.xScale(now))
      .attr('y1', graph.height)
      .attr('y2', 0);
  };

  return this;
})
.directive('timeline', ["EventService", "RasterService", "Timeline", function (EventService, RasterService, Timeline) {
  
  var link = function (scope, element, attrs, timelineCtrl, $timeout) {
    var dimensions = {
      width: window.innerWidth,
      height: 80,
      padding: {
        top: 3,
        right: 30,
        bottom: 20,
        left: 30
      }
    };
    var start = scope.timeState.start;
    var end = scope.timeState.end;
    var el = d3.select(element[0]).select("#timeline-svg-wrapper").select("svg");
    // Move timeline element into sight
    d3.select('#timeline').transition().duration(300).style('bottom', 0);
    
    // Create the timeline
    var timeline = new Timeline(start, end, dimensions, el, function (scale) {
        scope.$apply(function () {
          scope.timeState.start = scale.domain()[0].getTime();
          scope.timeState.end = scale.domain()[1].getTime();
          scope.timeState.changeOrigin = 'timeline';
          scope.timeState.changedZoom = Date.now();
        });
    });

    /**
     * Click handler to set scope.timeState.at to to timestamp where clicked
     * in timeline.
     *
     * Is eg used by dynamic raster functionality to get image for time
     * clicked.
     *
     */
    timeline.svg.on("click", function () {
      // Check whether user is dragging instead of clicking
      if (!d3.event.defaultPrevented) {
        var timeClicked = +(timeline.xScale.invert(d3.event.x - timeline.dimensions.padding.left));
        scope.timeState.at = timeClicked;
        scope.$digest();
      }
    });


    var nodataPosition = function (scale) {
      var year2014 = 1388534400000; // in msecs, since epoch
      var x = scale(year2014);
      return Math.round(x);
    };

    var zoomNodata = function () {
      // Update nodata zone
      graph.svg.select("#nodata")
        .attr('x', function (d) {
          return nodataPosition(graph.xScale) - graph.svg.select('#nodata').attr('width');
        });
    };


    var zoomed = function () {
      // Update x Axis
      graph.xAxis = timelineCtrl.makeAxis(graph.xScale, {orientation: "bottom", ticks: 5});
      timelineCtrl.drawAxes(graph, graph.xAxis);

      // Update circle positions
      graph.svg.selectAll("circle")
        .attr("cx", function (d) {
          return Math.round(graph.xScale(d.properties.timestamp));
        });
      // Update now indicator
      graph.svg.select('.now-indicator')
        .attr('x1', graph.xScale(scope.timeState.at) || graph.margin.left - 5)
        .attr('x2', graph.xScale(scope.timeState.at) || graph.margin.left - 5);

      // Update bars
      var data = RasterService.getIntensityData();
      var barWidth = graph.xScale(data[1][0]) - graph.xScale(data[0][0]);
      graph.svg.select("g").selectAll('.bar-timeline')
        .attr("x", function (d) { return graph.xScale(d[0]) - 0.5 * barWidth; })
        .attr('width', function (d) { return barWidth; });
      
      // Update timeState and wake up watches
      scope.$apply(function () {
        scope.timeState.start = graph.xScale.domain()[0].getTime();
        scope.timeState.end = graph.xScale.domain()[1].getTime();
        scope.timeState.changeOrigin = 'timeline';
        scope.timeState.changedZoom = Date.now();
      });
      zoomNodata();
    };

    // 
    // graph.svg.call(d3.behavior.zoom()
    //   .x(graph.xScale)
    //   .on("zoom", zoomed)
    // );

    /**
     * Updates the graph with new data
     */
    var updateTimeline = function (data, nEventTypes) {
      var newDimensions = timeline.dimensions;
      newDimensions.height = 75 + nEventTypes * 15;
      
      timeline.resize(newDimensions);

      timeline.drawCircles(data, nEventTypes, EventService.colors, 'timestamp', 'event_order');

      timeline.drawBars(RasterService.getIntensityData());

      // d3.select('#nodata').transition()
      //   .duration(500)
      //   .delay(500)
      //   .attr('height', newGraph.height);

      // // Update the brush if any
      // if (animationBrush) {
      //   timelineCtrl.updateBrush(newGraph.height);
      // }
      // // Create remaining scales
      // var yScale = timelineCtrl.scale({min: 1, max: nEventTypes},
      //                                 {min: newGraph.height - 27, max: 20 },
      //                                 {scale: 'linear'});
      // // Update the svg
      // timelineCtrl.drawCircles(newGraph.svg, newGraph.xScale, yScale,
      //                          graph.colorScale, 'timestamp', 'event_order',
      //                          data);
      // timelineCtrl.updateNow(newGraph, scope.timeState.at);
      // timelineCtrl.drawRainIntensity(RasterService.getIntensityData(), newGraph);
      // return newGraph;
    };

    scope.$watch('events.changed', function (n, o) {
      if (n === o) { return true; }
      var data = scope.events.data.features;
      updateTimeline(data, scope.events.types.count);
      //scope.timeState.changedZoom = Date.now();
      timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
      EventService.countCurrentEvents(scope.mapState.eventTypes, scope.events);
      // zoomed();
    });

    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.changeOrigin !== 'timeline') {
        // Update the scale in case something changed the timeState
        var x = {};
        x.min = new Date(scope.timeState.start);
        x.max = new Date(scope.timeState.end);
        var range = {};
        range.min = 0;
        range.max = graph.width;
        graph.xScale = timelineCtrl.scale(x, range, { type: 'time' });
        graph.xAxis = timelineCtrl.makeAxis(graph.xScale, {orientation: "bottom", ticks: 5});
        timelineCtrl.drawAxes(graph, graph.xAxis);

        // Add zoom functionality
        graph.svg.call(d3.behavior.zoom()
          .x(graph.xScale)
          .on("zoom", zoomed)
        );

        // Update circle positions
        graph.svg.selectAll("circle")
          .attr("cx", function (d) { return Math.round(graph.xScale(d.properties.timestamp)); });

        var data = RasterService.getIntensityData();
        timelineCtrl.drawRainIntensity(data, graph);
      }
    });






    scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
      EventService.countCurrentEvents(scope.mapState.eventTypes, scope.events);
    });

    // Create the brush to display automatic and manual selection of data in timeline both referred to as "animation"
    var animationBrush;
    scope.$watch('timeState.animation.enabled', function (newVal, oldVal) {
      if (newVal === oldVal) { return true; }
      if (scope.timeState.animation.enabled) {
        // Cancel zoom behavior
        timelineCtrl.zoom = d3.behavior.zoom()
            .x(graph.xScale)
            .on("zoom", null);
        graph.svg.on('.zoom', null);

        // Create the brush
        animationBrush = timelineCtrl.createBrush(graph);
        // Set the brush to the current animation start/end if defined and within the visible range, otherwise make one up
        if (scope.timeState.animation.start !== undefined
          && scope.timeState.animation.end !== undefined
          && scope.timeState.animation.start > scope.timeState.start
          && scope.timeState.animation.end < scope.timeState.end) {
          graph.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.animation.start), new Date(scope.timeState.animation.end)]));
        } else {
          var buffer = (scope.timeState.end - scope.timeState.start) / 100;
          graph.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.at), new Date(scope.timeState.at + buffer)]));
        }
        // Call brushmove to trigger update
        timelineCtrl.brushmove();
      }
      if (!scope.timeState.animation.enabled) {
        scope.timeState.animation.playing = false;
        timelineCtrl.removeBrush(graph.svg);
        // Re-add zoom functionality
        graph.svg.call(d3.behavior.zoom()
          .x(graph.xScale)
          .on("zoom", zoomed)
        );
        scope.timeState.changedZoom = Date.now();
      }
    });
    
    /**
     * Update brush and "Now" elements.
     *
     * If animation is enabled, update brush element; if rain is enabled as
     * well, update "Now" element.
     */
    scope.$watch('timeState.at', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.animation.enabled) {
        graph.svg.select(".brushed")
          .call(animationBrush.extent(
            [new Date(scope.timeState.animation.start),
             new Date(scope.timeState.animation.end)]));
        timelineCtrl.brushmove();
      }
      if (scope.tools.active === 'rain') {
        timelineCtrl.drawNow(graph, scope.timeState.at);
      }
    });

    /**
     * Hide the now indicator when switching 
     * to anything but the rain tool.
     */
    scope.$watch('tools.active', function (n, o) {
      if (n === o || scope.tools.active === 'rain') {
        return true;
      } else {
        timelineCtrl.hideNow(graph);
      }
    });


    window.onresize = function () {
      // Recreate timeline
      createTimeline();
      scope.events.changed = Date.now();
    };

  };

  return {
    replace: true,
    restrict: 'E',
    // scope: {
    //   timeState: '@',
    //   colors: '@',
    //   animation: '@',
    //   events: '@'
    // },
    link: link,
    controller: 'TimelineDirCtrl',
    templateUrl: 'templates/timeline.html'
  };
}]);
