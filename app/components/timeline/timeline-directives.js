'use strict';

/**
 * TimeLineDirective
 * @memberOf app
 *
 * @summary Timeline directive.
 *
 * @description Timeline directive.
 */
angular.module('lizard-nxt')
  .directive('timeline',
             ["$q",
              "RasterService",
              "UtilService",
              "Timeline",
              "VectorService",
              "DataService",
              "State",
              function ($q,
                        RasterService,
                        UtilService,
                        Timeline,
                        VectorService,
                        DataService,
                        State) {

  var link = function (scope, element, attrs, timelineCtrl) {

    var timelineSetsTime = false,

        showTimeline = false, // Is set by user clicking data label, when true
                              // timeline is shown.

        dimensions = {
          width: UtilService.getCurrentWidth(),
          height: 30,
          events: 25,
          bars: 35,
          padding: {
            top: 0,
            right: 0,
            bottom: 20,
            left: 0
          }
        },
        start = State.temporal.start,
        end = State.temporal.end,
        el = element.find('svg');

    var interaction = {

      /**
       * @function
       * @summary Update timeState on zoom.
       *
       * @param {object}  scale D3 xScale.
       */
      zoomFn: function (scale) {

        scope.$apply(function () {

          timelineSetsTime = true;
          State.temporal.timelineMoving = true;
          State.temporal.start = UtilService.getMinTime( scale.domain()[0].getTime() );
          State.temporal.end   = UtilService.getMaxTime( scale.domain()[1].getTime() );

          State.temporal.aggWindow = UtilService.getAggWindow(
            State.temporal.start,
            State.temporal.end,
            UtilService.getCurrentWidth()
          );
          State.temporal.at = UtilService.roundTimestamp(
            State.temporal.at,
            State.temporal.aggWindow,
            false
          );
        });

        timeline.drawAggWindow(State.temporal.at, State.temporal.aggWindow);
      },

      /**
       * @function
       * @summary Update zoomEnded to trigger new call for new timeline data.
       */
      zoomEndFn: function () {
        scope.$apply(function () {
          State.temporal.resolution = (
            State.temporal.end - State.temporal.start) /  UtilService.getCurrentWidth();
          getTimeLineData();
          State.temporal.timelineMoving = false;

          scope.$broadcast("$timelineZoomSuccess");
        });
      },

      /**
       * @function
       * @summary Move timeState.at to click location in timebar.
       * @description Update timeState.at to click location in timebar. Snaps
       * time to closest interval.
       *
       * @param {object} event - D3 event.
       * @param {object} scale - D3 scale.
       * @param {object} dimensions - object with timeline dimensions.
       */
      clickFn: function (event, scale, dimensions) {
        scope.$apply(function () {
          var timeClicked = +(scale.invert(
            event.pageX - dimensions.padding.left - UtilService.TIMELINE_LEFT_MARGIN
          ));
          State.temporal.at = UtilService.roundTimestamp(
            timeClicked,
            State.temporal.aggWindow
          );
        });
      },
    };

    // shift timeline's SVG element using it's CSS - set here by JS too stop stuff becoming unsyncable
    angular.element("#timeline-svg-wrapper svg")[0].style.left
      = UtilService.TIMELINE_LEFT_MARGIN + "px";

    // keep track of events in this scope
    scope.events = {nEvents: 0, slugs: []};

    // Initialise timeline
    var timeline = new Timeline(
      el[0], dimensions, start, end, interaction);

    setTimeout(interaction.zoomEndFn, 250);
    // HELPER FUNCTIONS

    /**
     * @function
     * @description Redetermines dimensions of timeline and calls resize.
     *
     * @param {object} newDim - object with new timeline dimensions.
     * @param {object} dim - object with old timeline dimensions.
     * @param {int} nEventTypes - number of event types (event series).
     */
    var updateTimelineHeight = function (nEventTypes) {
      var eventHeight,
          newDim = angular.copy(timeline.dimensions);

      newDim.height = dimensions.padding.bottom
        + dimensions.padding.top
        + nEventTypes * dimensions.events;

      if (getTimelineLayers(DataService.layerGroups).rain) {
        newDim.height += dimensions.bars;
      }

      newDim.height = Math.max(newDim.height, dimensions.height);

      if (showTimeline) {
        element[0].style.height = newDim.height + 5 + 'px'; // 5px margins
      }

      timeline.resize(
        newDim,
        State.temporal.at,
        State.temporal.aggWindow,
        nEventTypes
      );

    };

    /**
     * @function
     * @summary Temporary function to get relevant timeline layers from active
     *  layers.
     * @description Loops over layergroups and gets for each active layergroup
     * the vector and rain intensity layer. Those layers are used to draw data
     * in the timeline.
     *
     * TODO: refactor to query layerGroups by data type (event, raster, object)
     *
     * @param {object} layerGroups - NXT layerGroups object.
     * @returns {object} with: events (list of layers) and rain (nxtLayer).
     */
    var getTimelineLayers = function (layerGroups) {
      var timelineLayers = {events: {layers: [], slugs: []},
                            rain: undefined};
      angular.forEach(layerGroups, function (layergroup) {
        if (layergroup.isActive()) {
          angular.forEach(layergroup._dataLayers, function (layer) {
            if (layer.format === "Vector") {
              timelineLayers.events.layers.push(layer);
              timelineLayers.events.slugs.push(layer.slug);
            } else if (layer.format === "Store" &&
                       layer.slug === "rain") {
              timelineLayers.rain = layer;
            }
          });
        }
      });

      return timelineLayers;
    };

    /**
     * @function
     * @summary Get data for events and rain.
     * @description Get data for events and rain. If data exists (relevant
     * layers are active), data is drawn in timeline. Timelineheight is updated
     * accordingly.
     *
     * TODO: Now data is fetched via layerGroup loop logic (getTimelineLayers).
     * That will change later when we set data.
     */
    var getTimeLineData = function () {
      var timelineLayers = getTimelineLayers(DataService.layerGroups),
          context = {eventOrder: 1,
                     nEvents: scope.events.nEvents};

      // vector data (for now only events)
      if (timelineLayers.events.layers.length > 0) {
        scope.events.nEvents = timelineLayers.events.layers.length;

        // update inactive groups with nodata so update function is called
        // appropriately.
        angular.forEach(scope.events.slugs, function (slug) {
          if (timelineLayers.events.slugs.indexOf(slug) === -1) {
            timeline.drawLines([], scope.events.nEvents, slug);
          }
        });

        // update slugs on scope for housekeeping
        scope.events.slugs = timelineLayers.events.slugs;
        getEventData();
      } else {
        scope.events.nEvents = 0;
        timeline.drawLines(undefined, scope.events.nEvents);
      }

      // raster data (for now only rain)
      if (timelineLayers.rain !== undefined) {
        getTemporalRasterData(timelineLayers.rain,
                              timelineLayers.events.length);
      } else {
        timeline.removeBars();
      }

      updateTimelineHeight(scope.events.nEvents);
    };

    /**
     * @function
     * @summary get data for event layers and update timeline.
     * @description get data for event layers and update timeline.
     */
    var getEventData = function () {
      // create context for callback function, reset eventOrder to 1.
      var context = {
        eventOrder: 1,
        nEvents: scope.events.nEvents,
        slugs: scope.events.slugs
      };
      // Get data with type === 'Event'
      DataService.getData('timeline', {
        geom: State.spatial.bounds,
        start: State.temporal.start,
        end: State.temporal.stop,
        type: 'Event'
      }).then(null, null, function (response) {

        if (response && response.data) {
          // Add it to the timeline
          timeline.drawLines(
            response.data,
            context.eventOrder,
            response.layerGroupSlug,
            response.color
          );
          context.eventOrder++;
        }
      });
    };


    /**
     * @function
     * @summary get data for temporal raster layers.
     * @description  get data for temporal raster. If it gets a response updates
     * timeline height and draws bars in timeline.
     *
     * @param {object} rasterLayer - rasterLayer object.
     * @param {integer} nEvents - number of events.
     */
    var getTemporalRasterData = function (rasterLayer, nEvents) {

      var start = State.temporal.start,
          stop = State.temporal.end,
          bounds = State.spatial.bounds;

      // Has it's own deferrer to not conflict with
      // other deferrers with the same layerSlug
      RasterService.getData(
        rasterLayer,
        {
          geom: bounds,
          start: start,
          end: stop,
          agg: 'none',
          aggWindow: State.temporal.aggWindow,
          deferrer: {
            origin: 'timeline_' + rasterLayer,
            deferred: $q.defer()
          }
        }
      ).then(function (response) {
        timeline.drawBars(response.data);
      });
    };

    var timelineZoomHelper = function () {
      if (!State.temporal.timelineMoving) {
        if (!timelineSetsTime) {
          State.temporal.aggWindow = UtilService.getAggWindow(
            State.temporal.start,
            State.temporal.end,
            UtilService.getCurrentWidth()
          );
          timeline.zoomTo(
            State.temporal.start,
            State.temporal.end,
            State.temporal.aggWindow
          );
          getTimeLineData();
        } else {
          timelineSetsTime = false;
        }
      }
    };

    // END HELPER FUNCTIONS

    element[0].style.height = 0;

    scope.timeline.toggleTimelineVisiblity = function () {
      showTimeline = !showTimeline;
      if (!showTimeline) {
        element[0].style.height = 0;
      } else {
        updateTimelineHeight(scope.events.nEvents);
      }
    };

    // WATCHES

    /**
     * Updates area when user moves map.
     */
    scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      getTimeLineData();
    });

    /**
     * Updates area when users changes layers.
     */
    scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      getTimeLineData();
    });

    /**
     * Timeline is updated when something other than the timeline
     * updates the temporal extent.
     */
    scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      timelineZoomHelper();
    });

    scope.$on("$timelineZoomSuccess", function () {
      timelineZoomHelper();
    });

    /**
     * Update aggWindow element when timeState.at changes.
     */
    scope.$watch(State.toString('temporal.at'), function (n, o) {
      timeline.drawAggWindow(State.temporal.at, State.temporal.aggWindow);
    });

    /**
     * Round timeState.at when animation stops.
     */
    scope.$watch(State.toString('temporal.playing'), function (n, o) {
      if (n === o || n) { return true; }
      State.temporal.at = UtilService.roundTimestamp(
        State.temporal.at + State.temporal.aggWindow / 2,
        State.temporal.aggWindow,
        false
      );
    });

    /**
     * The timeline can be too early on initialization.
     * The leaflet events are not even started loading,
     * so the call returns an empty array.
     *
     * If nobody touches nothing, that means the timeline
     * won't show events, whilst they are being drawn
     * on the map.
     *
     * This evenListener ensures a retrieval of data
     * after the browser is done doing requests.
     */
    window.addEventListener('load', function () {
      getTimeLineData();
    });

    /**
     * Update timeline when browser window is resized.
     */
    window.onresize = function () {

      timeline.dimensions.width = UtilService.getCurrentWidth();
      timeline.resize(
        timeline.dimensions,
        State.temporal.at,
        State.temporal.aggWindow,
        scope.events.nEvents // TODO: get nEvents from somewhere
      );
    };

    // END WATCHES

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    templateUrl: 'timeline/timeline.html'
  };
}]);

