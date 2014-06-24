'use strict';

// Timeline for lizard.
app.directive('timeline', ["EventService", "RasterService", "Timeline",
  function (EventService, RasterService, Timeline) {
  
  var link = function (scope, element, attrs, timelineCtrl, $timeout) {

    var dimensions = {
      width: window.innerWidth,
      height: 65,
      events: 40,
      bars: 40,
      padding: {
        top: 3,
        right: 30,
        bottom: 20,
        left: 30
      }
    };
    var start = scope.timeState.start;
    var end = scope.timeState.end;
    var el = d3.select(element[0])
      .select("#timeline-svg-wrapper")
      .select("svg");
    
    var interaction = {
      /**
       * Update timeState on zoom
       *
       * Recieves the xScale as the first argument
       */
      zoomFn: function (scale) {
        scope.$apply(function () {
          scope.timeState.start = scale.domain()[0].getTime();
          scope.timeState.end = scale.domain()[1].getTime();
          scope.timeState.changeOrigin = 'timeline';
          scope.timeState.changedZoom = Date.now();
        });
      },
      /**
       * Update zoomEnded to trigger new call for rain intensity
       */
      zoomEndFn: function () {
        scope.$apply(function () {
          scope.timeState.zoomEnded = Date.now();
        });
      },
      /**
       * Enable animation on click
       *
       * Recieves d3.event, scale and timeline dimensions
       */
      clickFn: function (event, scale, dimensions) {
        scope.timeState.animation.enabled = true;
        var timeClicked = +(scale.invert(event.x - dimensions.padding.left));
        scope.timeState.at = timeClicked;
        scope.$digest();
      },
      /**
       * Update timeState on brush
       *
       * Recieves the d3 brush
       */
      brushFn: function (brush) {
        var s = brush.extent();
        var sSorted = [s[0].getTime(), s[1].getTime()].sort();
        scope.timeState.animation.start = sSorted[0];
        scope.timeState.at = sSorted[1];
        if (!scope.timeState.animation.playing && !scope.$$phase) {
          scope.$apply();
        }
      }
    };

    // Move timeline element into sight
    d3.select(element[0]).transition().duration(300).style('bottom', 0);

    // Create the timeline
    var timeline = new Timeline(el, dimensions, start, end, interaction);
    
    // Activate zoom listener
    timeline.addZoomListener();

    if (scope.tools.active === 'rain') {
      // Activate click listener
      timeline.addClickListener();
    }

    /**
     * Redetermines dimensions of timeline and calls resize.
     */
    var updateTimelineHeight = function (newDim, dim, nEventTypes) {
      var eventHeight;
      if (scope.tools.active === 'rain') {
        eventHeight = nEventTypes * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight: 0; // Default to 0px
        newDim.height = dim.height +
                               dim.bars +
                               eventHeight;
      } else {
        eventHeight = (nEventTypes - 1) * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight: 0; // Default to 0px
        newDim.height = dim.height + eventHeight;
      }
      timeline.resize(newDim);
    };

    /**
     * Timeline is updated when new events are added. 
     * 
     * Resizes timeline,
     * redraws existing events,
     * adds new events,
     * draws only those in the spatial extent of the map,
     * and counts the currently visible events.
     */
    scope.$watch('events.changed', function (n, o) {
      if (n === o) { return true; }
      updateTimelineHeight(angular.copy(timeline.dimensions), dimensions, scope.events.types.count);
      var data = scope.events.data.features;
      timeline.drawLines(data);
      timeline.drawEventsContainedInBounds(scope.mapState.bounds);
      EventService.countCurrentEvents(scope.mapState.eventTypes, scope.events);
    });

    /**
     * Timeline is updated when new aggregated raster data is available.
     *
     * Resizes timeline,
     * redraws existing bars,
     * adds new bars,
     * and removes old bars.
     */
    scope.$watch('raster.changed', function (n, o) {
      if (n === o) { return true; }
      if (scope.tools.active === 'rain') {
        updateTimelineHeight(angular.copy(timeline.dimensions), dimensions, scope.events.types.count);
        timeline.drawBars(RasterService.getIntensityData());
      } else {
        timeline.removeBars();
        updateTimelineHeight(angular.copy(timeline.dimensions), dimensions, scope.events.types.count);
      }
    });


    /**
     * Timeline is updated when something other than the timeline
     * updates the temporal extent.
     */
    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.changeOrigin !== 'timeline') {
        timeline.zoomTo(scope.timeState.start, scope.timeState.end);
      }
    });

    /**
     * Draws only those events that are in the spatial extent of the map.
     */
    scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      if (scope.events.data.features.length > 0) {
        timeline.drawEventsContainedInBounds(scope.mapState.bounds);
        EventService.countCurrentEvents(scope.mapState.eventTypes, scope.events);
      }
    });

    /**
     * Adds or removes brush when animation is toggled.
     *
     * When animation is enabled,
     * zoom functionality is disabled,
     * animation extent is set when not undefined or outside of temporal extent,
     * brush is drawn.
     *
     * When animation is disabled,
     * animation is paused,
     * brush is removed,
     * zoom functionality is added,
     * changedZoom is called to re-add all events on timeline to the map
     */
    scope.$watch('timeState.animation.enabled', function (newVal, oldVal) {
      if (newVal === oldVal) { return true; }
      if (scope.timeState.animation.enabled) {
        // Cancel zoom behavior
        timeline.removeZoomListener();

        var start;
        var end;
        if (scope.timeState.animation.start !== undefined
          && scope.timeState.at !== undefined
          && scope.timeState.animation.start > scope.timeState.start
          && scope.timeState.at < scope.timeState.end) {
          start = scope.timeState.animation.start;
          end = scope.timeState.at;
        } else {
          var buffer = (scope.timeState.end - scope.timeState.start) / 100;
          end = scope.timeState.at;
          start = scope.timeState.at - buffer;
        }

        // Draw the brush
        timeline.drawBrush(start, end);
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
        timeline.updateBrushExtent(scope.timeState.animation.start, scope.timeState.at);
      }
    });

    /**
     * Add click listener when rain is on
     */
    scope.$watch('tools.active', function (n, o) {
      if (n === o) { return true; }
      if (scope.tools.active === 'rain') {
        timeline.addClickListener();
      } else {
        timeline.removeClickListener();
      }
    });

    window.onresize = function () {
      var dimensions = timeline.dimensions;
      dimensions.width = window.innerWidth;
      timeline.resize(dimensions);
    };

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    templateUrl: 'templates/timeline.html'
  };
}]);
