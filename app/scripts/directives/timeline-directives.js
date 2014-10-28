'use strict';

// Timeline for lizard.
/**
 * @class angular.module('lizard-nxt')
  .TimeLineDirective
 * @memberOf app
 *
 * @summary Timeline directive.
 *
 * @description Timeline directive.
 */
angular.module('lizard-nxt')
  .directive('timeline', ["EventService", "RasterService", "UtilService",
                           "Timeline",
  function (EventService, RasterService, UtilService, Timeline) {

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
    },
    start = scope.timeState.start,
    end = scope.timeState.end,

    el = element[0].getElementsByTagName('svg')[0],

    interaction = {
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
       * Update zoomEnded to trigger new call for raster aggregate.
       */
      zoomEndFn: function () {
        scope.$apply(function () {
          var lg = scope.mapState.getActiveTemporalLayerGroup();
          if (lg) {
            getTemporalRasterData();
          }
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
       * Receives the d3 brush
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

    if (scope.mapState.getActiveTemporalLayerGroup()) {
      // Activate click listener
      timeline.addClickListener();
    }

    /**
     * Redetermines dimensions of timeline and calls resize.
     */
    var updateTimelineHeight = function (newDim, dim, nEventTypes) {
      var eventHeight;
      if (scope.mapState.getActiveTemporalLayerGroup()) {
        eventHeight = nEventTypes * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight : 0; // Default to 0px
        newDim.height = dim.height +
                               dim.bars +
                               eventHeight;
      } else {
        eventHeight = (nEventTypes - 1) * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight : 0; // Default to 0px
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
      updateTimelineHeight(angular.copy(timeline.dimensions), dimensions,
        scope.events.types.count);
      var data = scope.events.data.features;
      timeline.drawLines(data);
      timeline.drawEventsContainedInBounds(scope.mapState.bounds);
      EventService.countCurrentEvents(scope);
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
      if (scope.mapState.getActiveTemporalLayerGroup()) {
        updateTimelineHeight(angular.copy(timeline.dimensions),
          dimensions, scope.events.types.count);
        timeline.drawBars(RasterService.getIntensityData());
      } else {
        timeline.removeBars();
        updateTimelineHeight(angular.copy(timeline.dimensions),
          dimensions, scope.events.types.count);
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
        EventService.countCurrentEvents(scope);
      }

      var lg = scope.mapState.getActiveTemporalLayerGroup();
      if (lg) {
        getTemporalRasterData();
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
          start = scope.timeState.at - buffer;
          end = scope.timeState.at;
        }
        // Draw the brush
        timeline.drawBrush(start, end);
      } else {
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
     * If animation is enabled, update brush element; if raster animation is
     * enabled as well, update "Now" element.
     */
    scope.$watch('timeState.at', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.animation.enabled) {

        timeline.updateBrushExtent(
          scope.timeState.animation.start,
          scope.timeState.at
        );
      }
    });


    /**
     * Add click listener when raster animation is on.
     *
     * TODO: this is still hard coded to rain: setIntensityData
     */
    scope.$watch('mapState.getActiveTemporalLayerGroup()', function (n, o) {
      if (scope.mapState.getActiveTemporalLayerGroup()) {
        getTemporalRasterData();
        timeline.addClickListener();
      } else {
        timeline.removeClickListener();
        RasterService.setIntensityData([]);
      }
      scope.raster.changed = Date.now();
    });


    /**
     * Get aggregate data for current temporal raster.
     */
    var getTemporalRasterData = function () {
      var start = scope.timeState.start;
      var stop = scope.timeState.end;
      var bounds = scope.mapState.bounds;
      var activeTemporalLG = scope.mapState.getActiveTemporalLayerGroup();
      if (!!activeTemporalLG && activeTemporalLG.slug === 'rain') {
        // width of timeline
        var aggWindow = UtilService.getAggWindow(start, stop, window.innerWidth);
        // TODO: temporal hack to make cumulative rain graph working;
        // refactored with timeline update

        var wantedLayer;
        angular.forEach(activeTemporalLG._layers, function (layer) {
          if (layer.slug === 'radar/basic') {
            wantedLayer = layer;
          }
        });

        RasterService.getData(
          wantedLayer,
          {
            geom: bounds,
            start: start,
            end: stop,
            agg: 'none',
            aggWindow: aggWindow
          }
        ).then(function (response) {
            RasterService.setIntensityData(response);
            scope.raster.changed = Date.now();
          });
      }
    };

    //if (scope.mapState.getActiveTemporalLayer()) { getTemporalRasterData(); }

    window.onresize = function () {

      timeline.dimensions.width = window.innerWidth;
      timeline.resize(
        timeline.dimensions,
        scope.events.data.features
      );
    };

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    templateUrl: 'templates/timeline.html'
  };
}]);

