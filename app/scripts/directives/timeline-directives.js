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
              function ($q,
                        RasterService,
                        UtilService,
                        Timeline,
                        VectorService) {

  var link = function (scope, element, attrs, timelineCtrl) {

    var dimensions = {
      width: window.innerWidth,
      height: 75,
      events: 20,
      bars: 35,
      padding: {
        top: 12,
        right: 30,
        bottom: 20,
        left: 30
      }
    },

    start = scope.timeState.start,
    end = scope.timeState.end,

    el = element.find('svg'),

    interaction = {

      /**
       * @function
       * @summary Update timeState on zoom.
       *
       * @param {object}  scale D3 xScale.
       */
      zoomFn: function (scale) {

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
       * @function
       * @summary Update zoomEnded to trigger new call for new timeline data.
       */
      zoomEndFn: function () {
        scope.$apply(function () {
          scope.timeState.resolution = (
            scope.timeState.end - scope.timeState.start) /  window.innerWidth;
          getTimeLineData();
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
        var timeClicked = +(scale.invert(event.pageX - dimensions.padding.left));
        scope.timeState.at = UtilService.roundTimestamp(
          timeClicked,
          scope.timeState.aggWindow,
          false
        );

        scope.$digest();
      },
    };

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
    var updateTimelineHeight = function (newDim, dim, nEventTypes) {
      var eventHeight;
      if (getTimelineLayers(scope.mapState.layerGroups).rain && nEventTypes > 0) {
        eventHeight = (nEventTypes - 2) * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight : 0; // Default to 0px
        newDim.height = dim.height + dim.bars + eventHeight;
      } else {
        eventHeight = (nEventTypes - 2) * dim.events;
        eventHeight = eventHeight > 0 ? eventHeight : 0; // Default to 0px
        newDim.height = dim.height + eventHeight;
      }

      timeline.resize(newDim,
                      scope.timeState.at,
                      scope.timeState.aggWindow,
                      nEventTypes);
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
          angular.forEach(layergroup._layers, function (layer) {
            if (layer.type === "Vector") {
              timelineLayers.events.layers.push(layer);
              timelineLayers.events.slugs.push(layer.slug);
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
     * @summary Get data for events and rain.
     * @description Get data for events and rain. If data exists (relevant
     * layers are active), data is drawn in timeline. Timelineheight is updated
     * accordingly.
     *
     * TODO: Now data is fetched via layerGroup loop logic (getTimelineLayers).
     * That will change later when we set data.
     */
    var getTimeLineData = function () {
      var timelineLayers = getTimelineLayers(scope.mapState.layerGroups),
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
        // create context for callback function, reset eventOrder to 1.
        context = {
          eventOrder: 1,
          nEvents: scope.events.nEvents,
          slugs: scope.events.slugs
        };
        angular.forEach(timelineLayers.events.layers, getEventData, context);
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

      updateTimelineHeight(angular.copy(timeline.dimensions),
        dimensions, scope.events.nEvents);
    };

    /**
     * @function
     * @summary get data for event layers and update timeline.
     * @description get data for event layers and update timeline.
     *
     * @param {object} eventLayer - NXT eventLayer object.
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

      var that = this;
      eventData.then(function (response) {
        if (response !== undefined) {
          timeline.drawLines(
            response,
            that.eventOrder,
            eventLayer.slug,
            eventLayer.color
          );
          that.eventOrder++;
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

      var start = scope.timeState.start,
          stop = scope.timeState.end,
          bounds = scope.mapState.bounds;

      // Has it's own deferrer to not conflict with
      // other deferrers with the same layerSlug
      RasterService.getData(
        rasterLayer,
        {
          geom: bounds,
          start: start,
          end: stop,
          agg: 'none',
          aggWindow: scope.timeState.aggWindow,
          deferrer: {
            origin: 'timeline_' + rasterLayer,
            deferred: $q.defer()
          }
        }
      ).then(function (response) {
        timeline.drawBars(response);
      });
    };

    // END HELPER FUNCTIONS

    // WATCHES

    /**
     * Updates area when user moves map.
     */
    scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      getTimeLineData();
    });

    /**
     * Updates area when users changes layers.
     */
    scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      getTimeLineData();
    });

    /**
     * Timeline is updated when something other than the timeline
     * updates the temporal extent.
     */
    scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      if (scope.timeState.changeOrigin !== 'timeline') {
        scope.timeState.aggWindow = UtilService.getAggWindow(
          scope.timeState.start, scope.timeState.end, window.innerWidth);
        timeline.zoomTo(
          scope.timeState.start,
          scope.timeState.end,
          scope.timeState.aggWindow
        );
        getTimeLineData();
      }
    });

    /**
     * Update aggWindow element when timeState.at changes.
     */
    scope.$watch('timeState.at', function (n, o) {
      timeline.drawAggWindow(scope.timeState.at, scope.timeState.aggWindow);
    });

    /**
     * Round timeState.at when animation stops.
     */
    scope.$watch('timeState.animation.playing', function (n, o) {
      if (n === o || n) { return true; }
      scope.timeState.at = UtilService.roundTimestamp(
        scope.timeState.at, scope.timeState.aggWindow, false
      );
    });

    /**
     * Update timeline when browser window is resized.
     */
    window.onresize = function () {

      timeline.dimensions.width = window.innerWidth;
      timeline.resize(
        timeline.dimensions,
        scope.timeState.at,
        scope.timeState.aggWindow,
        scope.events.nEvents // TODO: get nEvents from somewhere
      );
    };

    // END WATCHES

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    templateUrl: 'templates/timeline.html'
  };
}]);

