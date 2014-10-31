'use strict';

// Timeline for lizard.
/**
  .TimeLineDirective
 * @memberOf app
 *
 * @summary Timeline directive.
 *
 * @description Timeline directive.
 */
angular.module('lizard-nxt')
  .directive('timeline',
             ["RasterService",
              "UtilService",
              "Timeline",
              "VectorService",
              function (RasterService,
                        UtilService,
                        Timeline,
                        VectorService) {

  var link = function (scope, element, attrs, timelineCtrl, $timeout) {

    var dimensions = {
      width: window.innerWidth,
      height: 40,
      events: 40,
      bars: 20,
      padding: {
        top: 5,
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
          scope.timeState.aggWindow = UtilService.getAggWindow(
            scope.timeState.start, scope.timeState.end, window.innerWidth);
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
          scope.timeState.resolution = (
            scope.timeState.end - scope.timeState.start) /  window.innerWidth;
          // snap timeState.at to nearest interval
          console.log(scope.timeState.at);
          scope.timeState.at = UtilService.roundTimestamp(
            scope.timeState.at, scope.timeState.aggWindow, false);
          console.log(scope.timeState.at);
          getTimeLineData();
        });
      },
      /**
       * Enable animation on click
       *
       * Recieves d3.event, scale and timeline dimensions
       */
      clickFn: function (event, scale, dimensions) {
        var timeClicked = +(scale.invert(event.x - dimensions.padding.left));
        scope.timeState.at = UtilService.roundTimestamp(
          timeClicked, scope.timeState.aggWindow, false);
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
     * @function
     * @description Redetermines dimensions of timeline and calls resize.
     */
    var updateTimelineHeight = function (newDim, dim, nEventTypes, features) {
      var eventHeight;
      console.log("update timeline height");
      if (scope.mapState.getActiveTemporalLayerGroup()) {
        eventHeight = nEventTypes * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight : 0; // Default to 0px
        newDim.height = dim.height + dim.bars + eventHeight;
      } else {
        eventHeight = (nEventTypes) * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight : 0; // Default to 0px
        newDim.height = dim.height + eventHeight;
      }
      timeline.resize(newDim,
                      scope.timeState.at,
                      scope.timeState.aggWindow,
                      features);
    };

    /** 
     * @function
     * @summary Temporary function to get relevant timeline layers from active
     *  layers.
     * @description Loops over layergroups and gets for each active layergroup
     * the vector and rain intensity layer. Those layers are used to draw data 
     * in the timeline.
     *
     * NOTE: now we loop over layerGroups; later we refactor so data is set on
     * the parent / master scope and this directive watches that data.
     *
     * @returns {object} events (list of layers) and rain layer (nxtLayer)
     */
    var getTimelineLayers = function (layerGroups) {
      var timelineLayers = {events: [], rain: undefined};
      angular.forEach(layerGroups, function (layergroup) {
        if (layergroup.isActive()) {
          angular.forEach(layergroup._layers, function (layer) {
            if (layer.type === "Vector") {
              timelineLayers.events.push(layer);
            } else if (layer.type === "Store" && layer.slug === "radar/basic") {
              timelineLayers.rain = layer;
            }
          });
        }
      });
      
      return timelineLayers;
    };

    /**
     * @function
     * @description Get data for events and rain. If data exists (relevant
     * layers are active), data is drawn in timeline. Timelineheight is updated
     * accordingly.NOTE: Now data is fetched via layerGroup loop logic
     * (getTimelineLayers). That will change later when we set data.
     *
     */
    var getTimeLineData = function () {
      console.log("Getting data for timeline");
      var timelineLayers = getTimelineLayers(scope.mapState.layerGroups);

      // vector data (for now only events)
      if (timelineLayers.events.length > 0) {
        angular.forEach(timelineLayers.events, getEventData,
                        timelineLayers.events);
      }

      // raster data (for now only rain)
      if (timelineLayers.rain !== undefined) {
        console.log("getting rain data");
        getTemporalRasterData(timelineLayers.rain,
                              timelineLayers.events.length);
      } else {
        timeline.removeBars();
        updateTimelineHeight(angular.copy(timeline.dimensions),
          dimensions, timelineLayers.events.length);
      }
    };

    /**
     * @function
     * @description get data for event layers and update timeline
     */
    var getEventData = function (eventLayer) {
      var eventData = VectorService.getData(
        eventLayer,
        {
          geom: scope.mapState.bounds,
          start: scope.timeState.start,
          end: scope.timeState.stop
        }
      );

      var nEvents = this.length;
      eventData.then(function (response) {
        updateTimelineHeight(angular.copy(timeline.dimensions),
          dimensions, nEvents, response);
        // TODO: somehow administer event order
        //response.eventOrder = 1;
        timeline.drawLines(response);
      });
    };

    /**
     * @function
     * @description  aggregate data for current temporal raster. If it gets a
     * response updates timeline height and draws bars in timeline.
     *
     * @param {nxtLayer} rasterLayer object
     * @param {integer} nEvents number of events
     * @returns {response}
     */
    var getTemporalRasterData = function (rasterLayer, nEvents) {
      var start = scope.timeState.start;
      var stop = scope.timeState.end;
      var bounds = scope.mapState.bounds;
      RasterService.getData(
        rasterLayer,
        {
          geom: bounds,
          start: start,
          end: stop,
          agg: 'none',
          aggWindow: scope.timeState.aggWindow
        }
      ).then(function (response) {
          timeline.drawBars(response);
          updateTimelineHeight(angular.copy(timeline.dimensions),
            dimensions, nEvents);
        });
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
        timeline.zoomTo(scope.timeState.start,
                        scope.timeState.end,
                        scope.timeState.aggWindow);
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

    /**
     * Update aggWindow.
     *
     * If animation is enabled, update aggWindow element.
     */
    scope.$watch('timeState.animation.playing', function (n, o) {
      if (n === o) { return true; }
      scope.timeState.at = UtilService.roundTimestamp(
        scope.timeState.at, scope.timeState.aggWindow, false);
    });

    // END WATCHES

    window.onresize = function () {

      timeline.dimensions.width = window.innerWidth;
      timeline.resize(
        timeline.dimensions,
        scope.timeState.at,
        scope.timeState.aggWindow,
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

