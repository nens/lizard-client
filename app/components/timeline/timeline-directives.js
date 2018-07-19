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
              "ChartCompositionService",
              "RasterService",
              "UtilService",
              "Timeline",
              "VectorService",
              "DataService",
              "EventAggregateService",
              "State",
              function ($q,
                        $timeout,
                        ChartCompositionService,
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
          width: getRequiredTimelineWidth(element),
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

    // D3 fires zoomEnd on click event and clicks on zoom events. The clicks on
    // zoomEnd are prevented by the timeline. ZoomEnd callback keeps track of
    // changes to temporal.start and temporal.end and only sets timelineMoving
    // and triggers a digest loop if they changed.
    var oldStart = State.temporal.start;
    var oldEnd = State.temporal.end;

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
        if (
          State.temporal.start !== oldStart
          && State.temporal.end !== oldEnd
        ) {
          State.temporal.timelineMoving = true;
          scope.$apply(function () {
            getTimeLineData();
          });
          State.temporal.timelineMoving = false;
        }
        oldStart = State.temporal.start;
        oldEnd = State.temporal.end;
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
    var events = {nEvents: 0, uuids: []};

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
      var timelineLayers = {
        eventseries: [],
        rasters: [],
        rain: undefined
      };

      angular.forEach(layers, function (layer) {
        if (layer.active) {
          var dataLayer = _.find(DataService.dataLayers, {uuid: layer.uuid});
          if (dataLayer && layer.type === 'eventseries') {
            timelineLayers.eventseries.push(dataLayer);
          } else if (State.context === 'map' && dataLayer && layer.type === "raster") {
            if (State.isRainyLayer(dataLayer) && !timelineLayers.rain) {
              // Show rain bars
              timelineLayers.rain = dataLayer;
            } else {
              // Show ticks
              timelineLayers.rasters.push(dataLayer);
            }
          }
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
        // update uuids on scope for housekeeping
        events.uuids = _.flatMap(timelineLayers.eventseries, 'uuid');
        getEventData(timelineLayers.eventseries);
      } else {
        events.nEvents = 0;
        timeline.drawCircles(undefined, events.nEvents);
      }

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
        uuids: events.uuids
      };

      var draw = function (response) {

        if (response) {
          // Add it to the timeline
          var data = EventAggregateService.aggregate(
            response,
            State.temporal.aggWindow
          );

          timeline.drawCircles(
            data,
            context.eventOrder,
            this.uuid,
            this.color,
            State.temporal.aggWindow
          );
          context.eventOrder++;
        }
      };

      var boundsGj = UtilService.lLatLngBoundsToGJ(State.spatial.bounds);

      angular.forEach(eventseries, function (_eventseries) {
        // Get data with type === 'eventseries'
        _eventseries.getData({
          geom: boundsGj,
          start: State.temporal.start,
          end: State.temporal.end,
        }).then(draw.bind(_eventseries));
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
          boundsGj = UtilService.lLatLngBoundsToGJ(State.spatial.bounds);

      // Has it's own deferrer to not conflict with
      // other deferrers with the same layerSlug
      rasterLayer.getData(
        {
          geom: boundsGj,
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
      rasterLayers.forEach(function (raster) {
        if (!raster.temporal) {
          return;
        }
        raster.getTimesteps({
          start: State.temporal.start,
          end: State.temporal.end
        }).then(function (response) {
          if (response && response !== 'null') {
            timeline.drawTickMarks(response.data.steps);
          }
        });
      });
    };

    // END HELPER FUNCTIONS

    scope.timeline.toggleTimeCtx = function () {
      scope.timeline.toggleTimelineVisiblity();
      scope.transitionToContext(State.context === 'map' ? 'charts' : 'map');
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
    scope.$watch(State.toString('layers.active'), function (n, o) {
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
     * Decide whether we show the timeline.
     *
     * This depends on the presence of active temporal layers and on
     * on selected assets with timeseries, so we watch those.
     */
    scope.$watch(
      function () {
        return JSON.stringify([
          State.layers,
          State.annotations.active,
          State.assets,
          DataService.assets,
          ChartCompositionService.composedCharts.length
        ]);
      },
      function (n, o) {
        var showTemporalData;
        if (State.context === 'charts') {
          showTemporalData = needToShowTimelineInDashboard();
        } else {
          showTemporalData = needToShowTimelineInMap();
        }
        // Only toggle TL visibility when needed too:
        if (State.temporal.showingTemporalData !== showTemporalData) {
          State.temporal.showingTemporalData = showTemporalData;
          toggleTimeline();
        }
      }
    );

    /**
     * Decide whether we show the timeline after switching context (i.e.
     * when switching: State.context="map" <=> State.context="charts")
     *
     * This depends on the presence of active temporal layers and on
     * on selected assets with timeseries.
     */

    scope.$watch(State.context, function (n, o) {
      if (State.context === 'charts') {
        State.temporal.showingTemporalData = needToShowTimelineInDashboard();
      } else {
        State.temporal.showingTemporalData = needToShowTimelineInMap();
      }

      $(document).ready(function () {
        toggleTimeline();
        if (State.temporal.showingTemporalData) {
          $timeout(getTimeLineData);
        }
      });
    });

    /**
     * Check whether we need to show/hide the timeline because of the presence
     * of timeseries:
     */
    var tlNeededBecauseTimeseries = function () {
      for (var i=0; i < DataService.assets.length; i++) {
        var asset = DataService.assets[i];
        var assetKey = asset.entity_name + '$' + asset.id;

        if (asset.timeseries && asset.timeseries.length &&
            (State.assets.indexOf(assetKey) !== -1 ||
             (asset.parentAsset && State.assets.indexOf(asset.parentAsset) !== -1))) {
          return true;
        }
      }
      return false;
    };

    /**
     * Check whether we need to show/hide the timeline because of the presence
     * of temporal rasters:
     */
    var tlNeededBecauseTemporalRasters = function () {
      if (State.layers && DataService.dataLayers) {
        return State.layers.some(function (layer) {
          return (
            layer.active &&
            // To check if it's temporal, we have to find a layer with the
            // same UUID in DataService.dataLayers, and check its .temporal
            // property.
            DataService.dataLayers.some(function (dl) {
              return (dl.uuid === layer.uuid && dl.temporal);
            })
          );
        });
      }
      return false;
    };

    /**
     * Check whether we need to show/hide the timeline because of the presence
     * of eventseries:
     */
    var tlNeededBecauseEventseries = function () {
      if (State.layers && State.layers.some(function (layer) {
        return layer.active && layer.type === 'eventseries';
      })) {
        return true;
      }
      return false;
    };

    /* Check whether we want to show the timeline in map ctx;
     */
    var needToShowTimelineInMap = function () {
      return (
        tlNeededBecauseTimeseries() ||
        tlNeededBecauseTemporalRasters() ||
        tlNeededBecauseEventseries() ||
        State.annotations.active);
    };

    /* Check whether we want to show the timeline in dashboard ctx;
     */
    var needToShowTimelineInDashboard = function () {
      return tlNeededBecauseEventseries() ||
        ChartCompositionService.chartsPresent();
    };

    /* Animate the timeline (dis-)appearance:
     */
    var toggleTimeline = function () {
      if (State.temporal.showingTemporalData) {
        angular.element('#timeline').removeClass('must-hide');
      } else {
        angular.element('#timeline').addClass('must-hide');
      }
    };

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
      var newWidth = getRequiredTimelineWidth(element);
      timeline.dimensions.width = newWidth;

      scope.$apply(function () {
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

  var WIDTH_OFFSET_FOR_DASHBOARD_TL = 32;

  var getRequiredTimelineWidth = function(elem) {
    var rawWidth = UtilService.getCurrentWidth(elem);
    return State.context === 'map'
      ? rawWidth
      : rawWidth - WIDTH_OFFSET_FOR_DASHBOARD_TL;
  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    templateUrl: 'timeline/timeline.html'
  };
}]);
