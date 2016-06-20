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
              "$timeout",
              "RasterService",
              "UtilService",
              "Timeline",
              "VectorService",
              "DataService",
              "EventAggregateService",
              "State",
              function ($q,
                        $timeout,
                        RasterService,
                        UtilService,
                        Timeline,
                        VectorService,
                        DataService,
                        EventAggregateService,
                        State) {

  var link = function (scope, element, attrs, timelineCtrl) {

    var timelineSetsTime = false,
        timelineSetsAt = false,

        showTimeline = true, // Is set by user clicking data label, when true
                              // timeline is shown.

        dimensions = {
          width: UtilService.getCurrentWidth(element),
          height: 45,
          events: 35,
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
          State.temporal.start = scale.domain()[0].getTime();
          State.temporal.end   = scale.domain()[1].getTime();

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
          getTimeLineData();
          State.temporal.timelineMoving = false;
        });
      },

      /**
       * @function
       * @description Update timeState.at to click location in timebar. Snaps
       * time to closest interval.
       *
       * @param {object} event - D3 event.
       * @param {object} scale - D3 scale.
       * @param {object} dimensions - object with timeline dimensions.
       */
      clickFn: function (timestamp, dimensions) {
        scope.$apply(function () {
          timelineSetsAt = true;
          State.temporal.at = UtilService.roundTimestamp(
            timestamp,
            State.temporal.aggWindow
          );
          timeline.drawAggWindow(State.temporal.at, State.temporal.aggWindow);
        });
      },
    };


    // keep track of events in this scope
    var events = {nEvents: 0, slugs: []};

    // Initialise timeline
    var timeline = new Timeline(el[0], dimensions, start, end, interaction);

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
    var updateTimelineSize = function (nEventTypes) {
      var eventHeight,
          newDim = angular.copy(timeline.dimensions);

      newDim.height = dimensions.padding.bottom
        + dimensions.padding.top
        + nEventTypes * dimensions.events;

      if (getTimelineLayers(State.layers).rain) {
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

      if (Timeline.onresize) {
        Timeline.onresize(newDim);
      }

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
    var getTimelineLayers = function (layers) {
      var timelineLayers = {eventseries: {layers: []},
                            rasters: {layers: []},
                            rain: undefined};

      if (State.context !== 'dashboard') {
        angular.forEach(layers, function (layer) {
          if (layer.active) {
            var dataLayer = _.find(DataService.dataLayers, {uuid: layer.uuid});
            if (dataLayer && layer.type === 'eventseries') {
              timelineLayers.eventseries.layers.push(dataLayer);
            }
            else if (dataLayer && layer.type === "raster" && State.context !== 'dashboard') {
              if (dataLayer.slug !== "rain") {
                timelineLayers.rasters.layers.push(dataLayer);
              } else if (dataLayer.slug === "rain") {
                timelineLayers.rain = dataLayer;
              }
            }
          }
        });
      }

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
      // NOTE: remember which layers *were* active? So we can do stuff with
      // turning off data (eg tickmarks).
      var timelineLayers = getTimelineLayers(State.layers),
          context = {eventOrder: 1,
                     nEvents: events.nEvents};

      if (timelineLayers.eventseries.length > 0 &&
        State.spatial.bounds.isValid()) {

        // update inactive groups with nodata so update function is called
        // appropriately.
        angular.forEach(events.uuids, function (uuid) {
          if (!_.find(timelineLayers.eventseries, {uuid: uuid})) {
            timeline.drawCircles([], events.nEvents, uuid);
          }
        });

        events.nEvents = timelineLayers.eventseries.length;
        // update slugs on scope for housekeeping
        events.uuids = _.flatMap(timelineLayers.eventseries, 'uuid');
        getEventData(timelineLayers.eventseries);
      } else {
        events.nEvents = 0;
        timeline.drawCircles(undefined, events.nEvents);
      }

      if (State.spatial.bounds.isValid()) { // no business here when invalid
                                            // bounds.

        if (timelineLayers.rain !== undefined) {
          getTemporalRasterData(
            timelineLayers.rain,
            timelineLayers.eventseries.length
          );
        } else {
          timeline.removeBars();
        }
        if (timelineLayers.rasters.length > 0) {
          getTemporalRasterDates(timelineLayers.rasters);
        } else {
          timeline.drawTickMarks([]);
        }

      }

      updateTimelineSize(events.nEvents);
    };

    /**
     * @function
     * @summary get data for event layers and update timeline.
     * @description get data for event layers and update timeline.
     */
    var getEventData = function (eventseries) {
      // create context for callback function, reset eventOrder to 1.
      var context = {
        eventOrder: 1,
        nEvents: events.nEvents,
        slugs: events.slugs
      };

      var draw = function (response) {

        if (response && response.data) {
          // Add it to the timeline
          var data = EventAggregateService.aggregate(
            response.data,
            State.temporal.aggWindow
          );

          timeline.drawCircles(
            data,
            context.eventOrder,
            response.layerGroupSlug,
            response.color,
            State.temporal.aggWindow
          );
          context.eventOrder++;
        }
      };
      angular.forEach(eventseries, function (_eventseries) {
        // Get data with type === 'eventseries'
        eventseries.getData({
          geom: UtilService.geomToWKT(State.spatial.bounds),
          start: State.temporal.start,
          end: State.temporal.end,
        }).then(draw);
      });
    };


    /**
     * @function
     * @summary get data for temporal raster layers.
     * @description  get data for temporal raster. If it gets a response updates
     * timeline height and draws bars in timeline.
     *
     * @param {object} rasterLayer - rasterLayer object.
     */
    var getTemporalRasterData = function (rasterLayer) {

      var start = State.temporal.start,
          stop = State.temporal.end,
          bounds = UtilService.geomToWKT(State.spatial.bounds);

      // Has it's own deferrer to not conflict with
      // other deferrers with the same layerSlug
      rasterLayer.getData(
        {
          geom: bounds,
          start: start,
          end: stop,
          aggWindow: State.temporal.aggWindow,
        }
      )
      .then(
        function (response) {
          if (response && response !== 'null' && response.data !== null) {
            timeline.drawBars(response.data);
          }
        }
      );
    };

    /**
     * @function
     * @summary get date array for temporal raster layers.
     * @description  get date array for temporal raster. If it gets a response
     * plots a tickmark in the timeline for every date.
     *
     * NOTE: refactor this function with getTemporalRasterData to use
     * dataService.
     *
     * @param {object} rasterLayer - rasterLayer object.
     */
    var getTemporalRasterDates = function (rasterLayers) {

      var start = State.temporal.start,
          stop = State.temporal.end,
          bounds = State.spatial.bounds,
          dates = [];

      var draw = function () {
        timeline.drawTickMarks(dates);
      };

      rasterLayers.forEach(function (raster) {
        raster.getData({
          start: State.temporal.start,
          end: State.temporal.end,
          geom: UtilService.geomToWKT(State.spatial.bounds.getCenter()),
          truncate: true,
        }).then(function (response) {
          if (response && response !== 'null') {
            dates = dates.concat(response.data);
          }
        });

      });

    };

    // END HELPER FUNCTIONS

    scope.timeline.toggleTimeCtx = function () {
      scope.timeline.toggleTimelineVisiblity();
      scope.transitionToContext(State.context === 'map' ? 'dashboard' : 'map');
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
      if (!timelineSetsTime) {

        timeline.zoomTo(
          State.temporal.start,
          State.temporal.end,
          State.temporal.aggWindow
        );
        getTimeLineData();
      }
      timelineSetsTime = false;
    });

    /**
     * Update aggWindow element when timeState.at changes.
     */
    scope.$watch(State.toString('temporal.at'), function (n, o) {
      if (!timelineSetsAt) {
        // update timeline when time-controller changes temporal.at state
        timeline.drawAggWindow(State.temporal.at, State.temporal.aggWindow);
      }
      timelineSetsAt = false;
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
    window.addEventListener('load', getTimeLineData);

    var resize = function () {

      var newWidth = UtilService.getCurrentWidth(element);

      scope.$apply(function () {
        timeline.dimensions.width = newWidth;
        timeline.resize(
          timeline.dimensions,
          State.temporal.at,
          State.temporal.aggWindow,
          events.nEvents // TODO: get nEvents from somewhere
        );
      });
    };

    /**
     * Update timeline when browser window is resized.
     */
    window.addEventListener('resize', resize);

    /**
     * Remove listeners.
     */
    scope.$on('$destroy', function () {
      window.removeEventListener('resize', resize);
      window.removeEventListener('load', getTimeLineData);
      timeline.destroy();
    });

    // END WATCHES

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    templateUrl: 'timeline/timeline.html'
  };
}]);
