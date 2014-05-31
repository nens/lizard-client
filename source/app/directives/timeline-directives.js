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
    var interaction = {
      zoomFn: function (scale) {
        scope.$apply(function () {
          scope.timeState.start = scale.domain()[0].getTime();
          scope.timeState.end = scale.domain()[1].getTime();
          scope.timeState.changeOrigin = 'timeline';
          scope.timeState.changedZoom = Date.now();
        });
      },
      clickFn: function (scale, dimensions) {
        var timeClicked = +(scale.invert(d3.event.x - dimensions.padding.left));
        scope.timeState.at = timeClicked;
        scope.$digest();
      },
      brushFn: function (brush) {
        var s = brush.extent();
        var sSorted = [s[0].getTime(), s[1].getTime()].sort();
        scope.timeState.animation.start = sSorted[0];
        scope.timeState.animation.end = sSorted[1];
        scope.timeState.at = (sSorted[0] + sSorted[1]) / 2;
        if (!scope.timeState.animation.playing && !scope.$$phase) {
          scope.$apply();
        }
      }
    };

    // Move timeline element into sight
    d3.select('#timeline').transition().duration(300).style('bottom', 0);

    // Create the timeline
    var timeline = new Timeline(el, dimensions, start, end, interaction);
    // Activate zoom and click listener
    timeline.addZoomListener();
    timeline.addClickListener();

    var updateTimelineHeight = function (dim, nEventTypes) {
      var newDimensions = timeline.dimensions;
      var eventHeight = (nEventTypes - 1) * dim.events;
      eventHeight = eventHeight > 0 ? eventHeight: 0; // Default to 0px
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
        timeline.removeZoomListener();

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

        // Draw the brush
        timeline.drawBrush(start, end, interaction.brushFn);
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
        // graph.svg.select(".brushed")
        //   .call(animationBrush.extent(
        //     [new Date(scope.timeState.animation.start),
        //      new Date(scope.timeState.animation.end)]));
        // timelineCtrl.brushmove();
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
    link: link,
    templateUrl: 'templates/timeline.html'
  };
}]);
