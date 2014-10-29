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
      height: 40,
      events: 20,
      bars: 20,
      padding: {
        top: 3,
        right: 30,
        bottom: 30,
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
        console.log("zooming time", scope.timeState.at);
        scope.$apply(function () {
          scope.timeState.start = scale.domain()[0].getTime();
          scope.timeState.end = scale.domain()[1].getTime();
          scope.timeState.changeOrigin = 'timeline';
          scope.timeState.changedZoom = Date.now();
        });
        timeline.drawAggWindow(scope.timeState.at, scope.timeState.aggWindow);
      },

      /**
       * Update zoomEnded to trigger new call for raster aggregate.
       */
      zoomEndFn: function () {
        scope.$apply(function () {
          console.log("zoomend", scope.timeState.at);
          console.log(scope.timeState.resolution);
          scope.timeState.aggWindow = UtilService.getAggWindow(
            scope.timeState.start, scope.timeState.end, window.innerWidth);
          scope.timeState.resolution = (
            scope.timeState.end - scope.timeState.start) /  window.innerWidth;
          console.log(scope.timeState.resolution);
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
    };

    // Move timeline element into sight
    d3.select(element[0]).transition().duration(300).style('bottom', 0);

    // Initialise timeline
    var timeline = new Timeline(el, dimensions, start, end, interaction);

    // Activate zoom and click listener
    timeline.addZoomListener();
    timeline.addClickListener();

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
      timeline.resize(newDim, scope.timeState.at);
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
      console.log("events changed");
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
      console.log("raster changed");
      if (scope.mapState.getActiveTemporalLayerGroup()) {
        updateTimelineHeight(angular.copy(timeline.dimensions),
          dimensions, scope.events.types.count);
        // timeline.drawBars(RasterService.getIntensityData());
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
        console.log("map moved, redraw events");
        timeline.drawEventsContainedInBounds(scope.mapState.bounds);
        EventService.countCurrentEvents(scope);
      }

      var lg = scope.mapState.getActiveTemporalLayerGroup();
      if (lg) {
        getTemporalRasterData();
      }
    });

    /**
     * Adds or removes aggregation window when animation is toggled.
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
        timeline.drawAggWindow(scope.timeState.at, scope.timeState.aggWindow);
      } else {
        scope.timeState.animation.playing = false;
        scope.timeState.changeOrigin = 'timeline';
        scope.timeState.changedZoom = Date.now();
      }
    });

    /**
     * Update aggWindow.
     *
     * If animation is enabled, update aggWindow element.
     */
    scope.$watch('timeState.at', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.animation.enabled) {
        timeline.drawAggWindow(scope.timeState.at, scope.timeState.aggWindow);
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
      } else {
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
        //var aggWindow = UtilService.getAggWindow(
          //start, stop, window.innerWidth);
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
            aggWindow: scope.timeState.aggWindow
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
        scope.timeState.at,
        // TODO: pass data from point object on scope?
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

