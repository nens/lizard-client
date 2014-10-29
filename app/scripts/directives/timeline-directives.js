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
  .directive('timeline', ["RasterService", "UtilService", "Timeline", "VectorService",
  function (RasterService, UtilService, Timeline, VectorService) {

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
          getTimeLineData();
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

    // HELPER FUNCTIONS

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
     * Temporary function to get data for events and rain
     *
     */
    var getTimeLineData = function () {
      console.log("Getting data for timeline");
      var eventLayer = scope.mapState.layerGroups.alarms._layers[0];
      // loop over LayerGroups and get vector layers and raster Layers.
      var eventData = VectorService.getData(
        eventLayer,
        {
          geom: scope.mapState.bounds,
          start: scope.timeState.start,
          end: scope.timeState.stop
        }
      );
      eventData.then(function (response) {console.log(response); });
      // TODO: draw events
      //updateTimelineHeight();
      //var data = scope.events.data.features;
      //timeline.drawLines(data);
      //timeline.drawEventsContainedInBounds(scope.mapState.bounds);
      console.log("getting rain data");
      getTemporalRasterData();
    };

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
            console.log("raster response received");
            updateTimelineHeight(angular.copy(timeline.dimensions),
              dimensions, 0);
            timeline.drawBars(response);
          });
      } else {
        timeline.removeBars();
        updateTimelineHeight(angular.copy(timeline.dimensions),
          dimensions, 0);
      }
    };

    // END HELPER FUNCTIONS

    // WATCHES

    /**
     * Updates area when user moves map.
     */
    scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      console.log("bounds changed, update events");
      getTimeLineData();
    });

    /**
     * Updates area when users changes layers.
     */
    scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      console.log("layergroups changed, update events");
      getTimeLineData();
    });

    /**
     * Timeline is updated when something other than the timeline
     * updates the temporal extent.
     *
     * TODO: check if this is still relevant
     */
    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.changeOrigin !== 'timeline') {
        timeline.zoomTo(scope.timeState.start, scope.timeState.end);
      }
    });

    /**
     * Update aggWindow.
     *
     * If animation is enabled, update aggWindow element.
     */
    scope.$watch('timeState.at', function (n, o) {
      if (n === o) { return true; }
      timeline.drawAggWindow(scope.timeState.at, scope.timeState.aggWindow);
    });

    // END WATCHES

    window.onresize = function () {

      timeline.dimensions.width = window.innerWidth;
      timeline.resize(
        timeline.dimensions,
        scope.timeState.at,
        // TODO: pass data from point object on scope?
        // TODO: data.features doesn't exist anymore?
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

