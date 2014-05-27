'use strict';

// Timeline for lizard.
app.directive('timeline', ["EventService", "RasterService", "Timeline", function (EventService, RasterService, Timeline) {
  
  var link = function (scope, element, attrs, timelineCtrl, $timeout) {
    var dimensions = {
      width: window.innerWidth,
      height: 70,
      events: 40,
      bars: 50,
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

    var zoomFn = function (scale) {
      scope.$apply(function () {
        scope.timeState.start = scale.domain()[0].getTime();
        scope.timeState.end = scale.domain()[1].getTime();
        scope.timeState.changeOrigin = 'timeline';
        scope.timeState.changedZoom = Date.now();
      });
    };
    
    var clickFn = function (scale, dimensions) {
      var timeClicked = +(scale.invert(d3.event.x - dimensions.padding.left));
      scope.timeState.at = timeClicked;
      scope.$digest();
    };

    var brushFn = function (brush) {
      var s = brush.extent();
      var sSorted = [s[0].getTime(), s[1].getTime()].sort();
      scope.timeState.animation.start = sSorted[0];
      scope.timeState.animation.end = sSorted[1];
      scope.timeState.at = (sSorted[0] + sSorted[1]) / 2;
      if (!scope.timeState.animation.playing && !scope.$$phase) {
        scope.$apply();
      }
    };

    // Create the timeline
    var timeline = new Timeline(el, angular.copy(dimensions), start, end, zoomFn, clickFn, brushFn);

    var updateTimelineHeight = function (dim, nEventTypes) {
      var newDimensions = timeline.dimensions;
      var eventHeight = (nEventTypes - 1) * dim.events;
      eventHeight = eventHeight > 0 ? eventHeight: 0;
      if (scope.tools.active === 'rain') {
        newDimensions.height = dim.height +
                               dim.bars +
                               eventHeight;
      } else {
        newDimensions.height = dim.height +
                               eventHeight;
      }
      timeline.resize(newDimensions);
    };

    scope.$watch('events.changed', function (n, o) {
      if (n === o) { return true; }
      updateTimelineHeight(dimensions, scope.events.types.count);
      scope.timeState.changeOrigin = 'timeline';
      scope.timeState.changedZoom = Date.now();
      var data = scope.events.data.features;
      timeline.drawCircles(data, scope.events.types.count, EventService.colors);
      timeline.drawEventsContainedInBounds(scope.mapState.bounds);
      EventService.countCurrentEvents(scope.mapState.eventTypes, scope.events);
    });

    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.changeOrigin !== 'timeline') {
        timeline.zoomTo(scope.timeState.start, scope.timeState.end);
        // timeline.drawBars(RasterService.getIntensityData());
      }
    });

    scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      timeline.drawEventsContainedInBounds(scope.mapState.bounds);
      EventService.countCurrentEvents(scope.mapState.eventTypes, scope.events);
    });

    scope.$watch('timeState.animation.enabled', function (newVal, oldVal) {
      if (newVal === oldVal) { return true; }
      if (scope.timeState.animation.enabled) {
        // Cancel zoom behavior
        timeline.removeZoom();

        var start;
        var end;
        if (scope.timeState.animation.start !== undefined
          && scope.timeState.animation.end !== undefined
          && scope.timeState.animation.start > scope.timeState.start
          && scope.timeState.animation.end < scope.timeState.end) {
          start = scope.timeState.animation.start;
          end = scope.timeState.animation.end;
        } else {
          var buffer = (scope.timeState.end - scope.timeState.start) / 100;
          start = scope.timeState.at;
          end = scope.timeState.at + buffer;
        }

        // Create the brush
        timeline.drawBrush();
        timeline.updateBrush(start, end);
      }
      if (!scope.timeState.animation.enabled) {
        scope.timeState.animation.playing = false;
        timeline.removeBrush();
        timeline.addZoomListener();
        scope.timeState.changeOrigin = 'timeline';
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
        timeline.updateNowElement(scope.timeState.at);
      }
    });

    /**
     * Hide the now indicator when switching 
     * to anything but the rain tool.
     */
    // scope.$watch('tools.active', function (n, o) {
    //   if (n === o || scope.tools.active === 'rain') {
    //     return true;
    //   } else {
    //     timelineCtrl.hideNow(graph);
    //   }
    // });

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
    controller: '',
    templateUrl: 'templates/timeline.html'
  };
}]);


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

    // var nodataPosition = function (scale) {
    //   var year2014 = 1388534400000; // in msecs, since epoch
    //   var x = scale(year2014);
    //   return Math.round(x);
    // };

    // var zoomNodata = function () {
    //   // Update nodata zone
    //   graph.svg.select("#nodata")
    //     .attr('x', function (d) {
    //       return nodataPosition(graph.xScale) - graph.svg.select('#nodata').attr('width');
    //     });
    // };


    // var zoomed = function () {
    //   // Update x Axis
    //   graph.xAxis = timelineCtrl.makeAxis(graph.xScale, {orientation: "bottom", ticks: 5});
    //   timelineCtrl.drawAxes(graph, graph.xAxis);

    //   // Update circle positions
    //   graph.svg.selectAll("circle")
    //     .attr("cx", function (d) {
    //       return Math.round(graph.xScale(d.properties.timestamp));
    //     });
    //   // Update now indicator
    //   graph.svg.select('.now-indicator')
    //     .attr('x1', graph.xScale(scope.timeState.at) || graph.margin.left - 5)
    //     .attr('x2', graph.xScale(scope.timeState.at) || graph.margin.left - 5);

    //   // Update bars
    //   var data = RasterService.getIntensityData();
    //   var barWidth = graph.xScale(data[1][0]) - graph.xScale(data[0][0]);
    //   graph.svg.select("g").selectAll('.bar-timeline')
    //     .attr("x", function (d) { return graph.xScale(d[0]) - 0.5 * barWidth; })
    //     .attr('width', function (d) { return barWidth; });
      
    //   // Update timeState and wake up watches
    //   scope.$apply(function () {
    //     scope.timeState.start = graph.xScale.domain()[0].getTime();
    //     scope.timeState.end = graph.xScale.domain()[1].getTime();
    //     scope.timeState.changeOrigin = 'timeline';
    //     scope.timeState.changedZoom = Date.now();
    //   });
    //   zoomNodata();
    // };

    // // 
    // // graph.svg.call(d3.behavior.zoom()
    // //   .x(graph.xScale)
    // //   .on("zoom", zoomed)
    // // );