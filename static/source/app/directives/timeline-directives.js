'use strict';

// Timeline for lizard.
app.controller('TimelineDirCtrl', function ($scope) {
  this.createCanvas = function (svg, options) {
    // Draws a blank canvas based on viewport
    var margin = {
      top: 3,
      right: 30,
      bottom: 20,
      left: 30
    };

    var width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    svg.attr('width', options.width)
      .attr('height', options.height)
      .style("margin-top", margin.top)
      .append("g")
        .attr("transform", "translate(" + margin.left + ", 0)")
        //.style("transform", "translate3d(" + margin.left + "," + margin.top + ")")
        .append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "plot-temporal");
    // Create line for the timeState.at just out of sight
    svg.select('g').append('line')
      .attr('class', 'now-indicator')
      .attr('x1', - margin.left - 5)
      .attr('x2', - margin.left - 5)
      .attr('y1', height)
      .attr('y2', 0);
    // Create element for axis
    svg.select('g').append("g")
      .attr('class', 'x axis')
      .attr("transform", "translate(0 ," + height + ")");
    return {
      svg: svg,
      height: height,
      width: width,
      margin: margin
    };
  };

  this.updateCanvas = function (graph, options) {
    graph.width = options.width - graph.margin.left - graph.margin.right;
    graph.height = options.height - graph.margin.top - graph.margin.bottom;

    graph.svg.transition()
      .duration(500)
      .delay(500)
      .attr('height', options.height)
      .select("g")
      .attr("transform", "translate(" + graph.margin.left + ", 0)")
      .select('g')
      .attr("transform", "translate(0 ," + graph.height + ")");
    graph.svg.select("g").select("rect")
      .attr("height", graph.height);
    return graph;
  };

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
          .range($scope.colors[8]);
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
    graph.svg.select('g').select('g')
      .call(graph.xAxis);
  };

  this.drawCircles = function (svg, xScale, yScale, colorScale, xKey, yKey, colorKey, data) {
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
   * Hides the now element by moving it out of side to the left.
   *
   * @param  {graph object} graph contains the svg
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
.directive('timeline', [ function () {
  
  var link = function (scope, element, attrs, timelineCtrl) {

    /**
     * Draws an empty timeline
     */
    var createTimeline = function () {
      var canvasOptions = {width: window.innerWidth, height: 50};
      d3.select('#timeline').transition().duration(300).style('bottom', 0);
      var svg = d3.select("#timeline-svg-wrapper")
                  .select("svg").html('');
      var graph = timelineCtrl.createCanvas(svg, canvasOptions);
      // Add x axis
      var x = {};
      x.min = new Date(scope.timeState.start);
      x.max = new Date(scope.timeState.end);
      var range = {};
      range.min = 0;
      range.max = graph.width;
      graph.xScale = timelineCtrl.scale(x, range, { type: 'time' });
      graph.xAxis = timelineCtrl.makeAxis(graph.xScale, {orientation: "bottom", ticks: 5});
      timelineCtrl.drawAxes(graph, graph.xAxis);

      /**
       * Click handler to set scope.timeState.at to to timestamp where clicked
       * in timeline.
       *
       * Is eg used by dynamic raster functionality to get image for time
       * clicked.
       *
       */
      graph.svg.on("click", function () {
        var timeClicked = +(graph.xScale.invert(d3.event.x - graph.margin.left));
        scope.timeState.at = timeClicked;
        scope.$digest();
      });

      // Add color scale
      graph.colorScale = timelineCtrl.scale(null, null, { scale: 'ordinal' });

      // Add zoom functionality
      graph.svg.call(d3.behavior.zoom()
        .x(graph.xScale)
        .on("zoom", zoomed)
      );

      return graph;
    };

    /**
     * Updates the graph with new data
     */
    var updateTimeline = function (graph, data, nEventTypes) {
      var canvasOptions = {width: element.width(), height: 45 + nEventTypes * 25};
      var newGraph = timelineCtrl.updateCanvas(graph, canvasOptions);
      // Update the brush if any
      if (animationBrush) {
        timelineCtrl.updateBrush(newGraph.height);
      }
      // Create remaining scales
      var yScale = timelineCtrl.scale({min: 1, max: nEventTypes}, { min: newGraph.height - 27, max: 20 }, {scale: 'linear'});
      // Update the svg
      timelineCtrl.drawCircles(newGraph.svg, newGraph.xScale, yScale, graph.colorScale, 'timestamp', 'event_type', 'event_type', data);
      timelineCtrl.updateNow(newGraph, scope.timeState.at);
      return newGraph;
    };

    var zoomed = function () {
      // Update x Axis
      graph.svg.select(".x.axis").call(timelineCtrl.makeAxis(graph.xScale, {
        orientation: "bottom",
        ticks: 5
      }));
      // Update circle positions
      graph.svg.selectAll("circle")
        .attr("cx", function (d) { return Math.round(graph.xScale(d.properties.timestamp)); });
      // Update now indicator
      graph.svg.select('.now-indicator')
        .attr('x1', graph.xScale(scope.timeState.at) || graph.margin.left - 5)
        .attr('x2', graph.xScale(scope.timeState.at) || graph.margin.left - 5);
      // Update timeState and wake up watches
      scope.$apply(function () {
        scope.timeState.start = graph.xScale.domain()[0].getTime();
        scope.timeState.end = graph.xScale.domain()[1].getTime();
        scope.timeState.changeOrigin = 'timeline';
        scope.timeState.changedZoom = !scope.timeState.changedZoom;
      });
    };

    // Get the timeline-graph
    var graph = createTimeline();

    scope.$watch('events.changed', function (n, o) {
      if (n === o) { return true; }
      var data = scope.events.data.features;
      graph = updateTimeline(graph, data, scope.events.types.count);
      scope.timeState.changedZoom = Date.now();
      timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
      scope.events.countCurrentEvents();
    });

    scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
      scope.events.countCurrentEvents();
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
    
    scope.$watch('timeState.at', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.animation.enabled) {
        timelineCtrl.hideNow(graph);
        graph.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.animation.start), new Date(scope.timeState.animation.end)]));
        timelineCtrl.brushmove();
      } else if (scope.tools.active === 'rain') {
        timelineCtrl.drawNow(graph, scope.timeState.at);
      } else {
        timelineCtrl.hideNow(graph);
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

    scope.$watch('timeState.changedZoom', function () {
      if (scope.timeState.changeOrigin !== 'timeline') {
        // Update the scale in case somethin changed the timeState
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
