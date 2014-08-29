/**
 * Add non tiled d3 event vector layer
 *
 * Implemented as a layer to display point events. Events
 * are aggregated based on viewport (spatial extent) and
 * time-interval (temporal extent, from timeline)
 *
 */
app.directive('vectorlayer', ['EventService', '$rootScope',
  'ClickFeedbackService', 'MapService',
  function (EventService, $rootScope, ClickFeedbackService, MapService) {

  return {
    restrict: 'A',
    link: function (scope, element, attrsM) {

      // declaring all local vars for current scope:
      var getEventColor, eventClickHandler, getFeatureSelection, matchLocation,
          idExtractor, createEventLayer, d3eventLayer, _highlightEvents;

      /**
       * Get color from feature.
       *
       * @param {object} d - D3 bound data object; expects color property.
       */
      getEventColor = function (d) {
        return d.properties.color;
      };

      /**
       * Highlights and unhighlights data points
       * @param {string} - String with id that should be highlighted
       */
      _highlightEvents = function (id) {
        // unhighlight events
        d3.selectAll(".circle.event")
          .classed("highlighted-event", false)
          .attr("data-init-color", getEventColor)
          .attr("fill", getEventColor);
        // highlight selected event
        d3.select("." + id)
          .classed("highlighted-event", true)
          .transition()
          .duration(1000)
          .attr("fill", "black");


        // hacky hack is oooow soooo hacky
        setTimeout(function () {
          ClickFeedbackService.removeLocationMarker();
        }, 300);

      };

      /**
       * Event click handler.
       *
       * Gets id's highlights events,
       * matchesLocations and passes them to 'here' object
       * For pointObject to pick 'em up.
       *
       * @param {object} d - D3 bound data object.
       */
      eventClickHandler = function (d) {

        var id, here, features, f;

        features = matchLocation(d, d3eventLayer._data.features);
        id = this.options.selectorPrefix + this._idExtractor(d);
        here = new L.LatLng(d.geometry.coordinates[1],
                            d.geometry.coordinates[0]);
        var eventDatastuff = {
          type: 'events',
          eventData: {
            features: features
          }
        };

        _highlightEvents(id);

        var setEventOnPoint = function () {
          scope.mapState.here = here;
          scope.box.type = 'pointObject';
        };

        if (!scope.$$phase) {
          scope.$apply(setEventOnPoint);
        } else {
          setEventOnPoint();
        }

        $rootScope.$broadcast('newPointObject', eventDatastuff);
      };

      /**
       * Gets data point and searches through list of
       * geojson features for matches. Returns matchedLocations
       * @param  {object} d       Clicked object
       * @param  {array} features List of other geojson features.
       * @return {array}          List of Matched Locations
       */
      matchLocation = function (d, features) {
        var matchedLocation = [],
            f;
        for (f = 0; f < features.length; f++) {
          if (d.geometry.coordinates[0] === features[f].geometry.coordinates[0]
              &&
              d.geometry.coordinates[1] === features[f].geometry.coordinates[1]
              ) {
            matchedLocation.push(features[f]);
          }
        }
        return matchedLocation;
      };

      /**
       * Utilfunction that creates/returns a "feature"
       *
       * @parameter {object} g - D3 g (svg) selection.
       * @parameter {object} data - Event data object.
       * @returns {object} - D3 selection.
       */
      getFeatureSelection = function (g, data) {
        return g.selectAll("path")
                .data(data.features, function (d) { return d.id; });
      };

      /**
       * Generator function to extract id's from geoJson.
       *
       * @param  {object} feature - geoJson feature
       * @return {string} id - String
       */
      idExtractor = function (feature) {
        var id = feature.id.toString().split('.')[0] +
                  '_es_' + feature.properties.event_series;
        return id;
      };

      /**
       * Creates svg layer in leaflet's overlaypane and adds events as circles
       *
       * On leaflet's viewreset the svg rescaled and repositioned. This
       * function should also be called when the data is changed.
       *
       * @parameter {object} data - Object
       * @return {object} eventLayer - Leaflet layer object
       */
      createEventLayer = function (data) {

        // declaring all local vars in 1st line of function body!
        var map, svg, g, transform, path, bounds, featureSelection,
            projectPoint, reset;


        // if d3eventlayer does not exist create.
        if (d3eventLayer === undefined) {
          d3eventLayer = L.nonTiledGeoJSONd3(data, {
            ext: 'd3',
            name: 'events',
            selectorPrefix: 'm',
            class: 'circle event'
          });
        }

        MapService.addLayer(d3eventLayer);
        d3eventLayer._bindClick(eventClickHandler);

        // for backwards compatibility.
        d3eventLayer.g = d3eventLayer._container.selectAll("g");
        d3eventLayer.svg = d3eventLayer.svg;
        d3eventLayer.reset = d3eventLayer._onMove;

        return d3eventLayer;
      };

      /**
       * Updates svg layer in leaflet's overlaypane with new data object
       *
       * First call the reset function to give the svg enough space for the
       * new data.Identify path elements with data objects via id and update,
       * create or remove elements.
       *
       * @parameter: object eventLayer object to update
       * @parameter: data object
       * @return: object eventLayer object
       */
      var updateEventLayer = function (eventLayer, data) {
        eventLayer._data = data;
        eventLayer._refreshData();
        eventLayer._bindClick(eventClickHandler);
      };

      var removeEventLayer = function (eventLayer) {
        MapService.removeLayer(eventLayer);
        return false;
      };

      /**
       * Count overlapping locations.
       *
       * Adds a lat + lon key to overlapLocations if not defined and sets
       * counter to 1. If key exists adds +1 to counter. Returns counter for
       * current key.
       *
       * TODO: this code is duplicate from lib/Layer.GeoJSONd3.js. Refactor so
       * everything is done with enter, update and exit selections of d3.
       *
       * @parameter {object} d D3 data object, should have  a geometry property
       * @returns {integer} Count for current key
       *
       */
      var _countOverlapLocations = function (overlapLocations, d) {
        var key = "x:" + d.geometry.coordinates[0] +
                  "y:" + d.geometry.coordinates[1];
        var coord = overlapLocations[key];
        if (coord === undefined) {
          overlapLocations[key] = 1;
        } else {
          overlapLocations[key] += 1;
        }
        return overlapLocations[key];
      };

      /**
       * Draw events based on current temporal extent
       *
       * Hide all elements and then unhides when within the given start
       * and end timestamps.
       *
       * @parameter: int start start timestamp in epoch ms
       * @parameter: int end end timestamp in epoch ms
       */
      var drawTimeEvents = function (start, end) {
        //NOTE: not optimal class switching
        d3.selectAll(".circle").classed("hidden", true);
        d3.selectAll(".circle")
          .classed("selected", function (d) {
            var s = [start, end];
            var time = d.properties.timestamp_end;
            var contained = s[0] <= time && time <= s[1];

            // Some book keeping to count
            d.inTempExtent = contained;
            return !!contained;
          });
        var selected = d3.selectAll(".circle.selected");

        // hack to update radius of event circles on brush move
        // duplicate code with Layer.GeoJSONd3.js
        // TODO: refactor this code into above fill for update of d3 selection
        var overlapLocations = {};
        selected.classed("hidden", false);
        selected
          .attr("r", function (d) {
            var radius, overlaps;
            overlaps = _countOverlapLocations(overlapLocations, d);
            // logarithmic scaling with a minimum radius of 6
            radius = 6 + (5 * Math.log(overlaps));
            return radius;
          });
        EventService.countCurrentEvents(scope);
      };


      /**
       * Watch that is fired when the timeState has changed
       *
       * Calls functions to draw events currently within the timeState
       * and to count currently visible events
       */
      scope.$watch('timeState.changedZoom', function (n, o) {
        if (n === o) { return true; }
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
        EventService.countCurrentEvents(scope);
      });

      scope.$watch('events.changed', function (n, o) {
        if (n === o) { return true; }
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
        EventService.countCurrentEvents(scope);
      });

      /**
       * Watch that is fired when the animation has stepped
       *
       * Calls functions to draw events currently within the animation bounds
       * and to count currently visible events
       */
      scope.$watch('timeState.at', function () {

        if (scope.timeState.animation.enabled) {

          drawTimeEvents(
            scope.timeState.animation.start,
            scope.timeState.at
          );

          EventService.countCurrentEvents(scope);
        }
      });

      /**
       * Watch that is fired when events data object has changed
       *
       * Calls functions to create, update or remove eventLayer.
       * And makes sure events are drawn in accordance to the current timeState.
       */
      var eventLayer;
      scope.$watch('events.changed', function (n, o) {
        if (n === o) { return true; }
        if (eventLayer) {
          if (scope.events.data.features.length === 0) {
            eventLayer = removeEventLayer(eventLayer);
          } else {
            updateEventLayer(eventLayer, scope.events.data);
          }
        } else {
          eventLayer = createEventLayer(scope.events.data);
        }
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
      });
    }
  };
}]);

/**
 * Impervious surface vector layer.
 *
 * Load data with d3 geojson vector plugin L.TileLayer.GeoJSONd3 in ./lib
 * bind highlight function to mouseover and mouseout events.
 *
 * NOTE: this contains quite some hard coded stuff. Candidate for refactoring
 * to make generic
 *
 */
app.directive('surfacelayer', ['MapService', function (MapService) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {

      var bottomLeft = {};

      /**
       * Style surface features.
       *
       * Function to style d3 features in d3 selection
       *
       * @param: features, d3 selection object
       */
      var surfaceStyle = function (features) {
        features
          .style("stroke-width", 0)
          .style("fill-opacity", 0);
      };

      /**
       * Convert list with values to d3 selector
       *
       * @param: list of values
       * @returns: concatenated d3 suitable OR selector
       */
      var listToSelector = function (list) {
        var selector = "";
        for (var i in list) {
          // prepend `.p` because classes can't start with an number
          selector += ".p" + list[i] + ", ";
        }
        selector = selector.slice(0, -2);

        return selector;
      };

      /**
       * Callback function to highlight surfaces connected to pipe
       *
       * Selects d3 objects based on ids in data property (in this case in
       * `impervious_surfaces`. On 'mouseover' highlights features, on
       * 'mouseout' fades features to transparant
       *
       * @param: e, event object, expects the data property to have a
       * `impervious_surfaces` property
       *
       */
      var highlightSurface = function (e) {
        if (e.data.impervious_surfaces !== undefined) {
          var surface_ids = JSON.parse(e.data.impervious_surfaces);
          if (surface_ids.indexOf("null") === -1) {
            var selector = listToSelector(surface_ids);
            if (e.type === 'mousemove') {
              d3.selectAll(selector)
                .style("fill", "#e74c3c")
                .style("fill-opacity", 0.6)
                .transition();
            } else if (e.type === 'mouseout') {
              d3.selectAll(selector)
                .transition()
                .duration(500)
                .style("stroke-width", 0)
                .style("fill-opacity", 0);
            }
          }
        }
      };

      var getLayer = MapService.getLayer;

      // Initialise geojson layer
      var surfaceLayer = L.geoJSONd3(
        'api/v1/tiles/impervioussurface/{z}/{x}/{y}.geojson',
        {
          applyStyle: surfaceStyle,
          class: "impervious_surface"
        });

      /**
       * Listen to tools model for pipe_surface tool to become active. Add
       * geojson d3 layer and bind mousemove and mouseout events to
       * highlight impervious surface.
       *
       */
      scope.$watch('tools.active', function (n, o) {
        if (n === o) { return true; }
        var pipeLayer = {};
        if (scope.tools.active === "pipeSurface") {
          MapService.addLayer(surfaceLayer);
          pipeLayer = getLayer('grid', 'waterchain');
          // icon active
          angular.element(".surface-info").addClass("icon-active");
          if (pipeLayer) {
            pipeLayer.on('mousemove', highlightSurface);
            pipeLayer.on('mouseout', highlightSurface);
          } else {
            // If there is no grid layer it is probably still being
            // loaded by the map-directive which will broadcast a
            // message when its loaded.
            scope.$on('waterchainGridLoaded', function () {
              if (scope.tools.active === 'pipeSurface') {
                pipeLayer = getLayer('grid', 'waterchain');
                pipeLayer.on('mousemove', highlightSurface);
                pipeLayer.on('mouseout', highlightSurface);
              }
            });
          }
        } else {
          pipeLayer = getLayer('grid', 'pipe');
          if (pipeLayer) {
            // icon inactive
            angular.element(".surface-info").removeClass("icon-active");
            pipeLayer.off('mousemove', highlightSurface);
            pipeLayer.off('mouseout', highlightSurface);
          }
          MapService.removeLayer(surfaceLayer);
        }
      });
    }
  };
}]);


var dummyResults = {

  type: "FeatureCollection",
  features: [

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [5.33, 52.52]
      },
      properties: {
        series: [
          {
            type: "timestamp",
            name: "timestamp",
            unit: "ms",
            quantity: "time"
          },
          {
            quantity: "velocity",
            type: "decimal",
            name: "speed",
            unit: "m/s",
            precision: 0
          },
          {
            quantity: "angle",
            type: "decimal",
            name: "direction",
            unit: "degrees",
            precision: 0
          }
        ],
        instants: [
          [1388531000000, 1388531300000, 1388531600000, 1388531900000, 1388532200000, 1388532500000],
          [10, 20, 50, 80, 90, 100],
          [45, 90, 135, 150, 180, 230]
        ],
        code: undefined,
        id: 1000,
        name: 'Een eerste stroming'
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [5.255, 52.517]
      },
      properties: {
        series: [
          {
            type: "timestamp",
            name: "timestamp",
            unit: "ms",
            quantity: "time"
          },
          {
            quantity: "velocity",
            type: "decimal",
            name: "speed",
            unit: "m/s",
            precision: 0
          },
          {
            quantity: "angle",
            type: "decimal",
            name: "direction",
            unit: "degrees",
            precision: 0
          }
        ],
        instants: [
          [1388531000000, 1388531300000, 1388531600000, 1388531900000, 1388532200000, 1388532500000],
          [100, 90, 80, 70, 60, 50],
          [45, 90, 135, 150, 180, 230]
        ],
        code: undefined,
        id: 1001,
        name: 'Ene tweede stroming'
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [5.46, 52.61]
      },
      properties: {
        series: [
          {
            type: "timestamp",
            name: "timestamp",
            unit: "ms",
            quantity: "time"
          },
          {
            quantity: "velocity",
            type: "decimal",
            name: "speed",
            unit: "m/s",
            precision: 0
          },
          {
            quantity: "angle",
            type: "decimal",
            name: "direction",
            unit: "degrees",
            precision: 0
          }
        ],
        instants: [
          [1388531000000, 1388531300000, 1388531600000, 1388531900000, 1388532200000, 1388532500000],
          [100, 100, 100, 100, 100, 100],
          [45, 90, 135, 150, 180, 230]
        ],
        code: undefined,
        id: 1002,
        name: 'Een dritte stroming'
      }
    },
  ]
};


/**
 * Add non-tiled d3 vector layer for currents.
 *
 * Implemented as a layer to display current speed/direction on the map.
 */
app.directive('temporalVectorLayer', ['UtilService', 'MapService',
  function (UtilService, MapService) {

  // declaring constants:
  var API_URL = '/api/v1/tiles/location/5/16/10.geojson'; // tmp

  // declaring local vars
  var mustDrawTVLayer,
      getTVData,
      createTVLayer,
      updateTVLayer,
      d3TVLayer,
      getTimeIndex,
      getValueFromTimeseriesJSON,
      mostRecentMeasurementTime;

  // Stubbed for now...
  mustDrawTVLayer = function (scope) {
    return true;
  };

  // Stubbed for now....
  getTVData = function () {
    return dummyResults;
  };

  getTimeIndex = function (scope, tvData, stepSize) {

    var i,
        virtualNow = scope.timeState.at,
        relevantTimestamps = tvData.features[0].properties.instants[0],
        currentTimestamp,
        minTimestamp,
        maxTimestamp;

    if (relevantTimestamps.length === 0) {
      console.log("[E] we don't have any relevant timestamps (i.e. no data!)");
      return;
    }

    minTimestamp = relevantTimestamps[0];
    maxTimestamp = relevantTimestamps[relevantTimestamps.length - 1];

    if (virtualNow < minTimestamp || virtualNow > maxTimestamp) {

      // if too early/late for any results, return undefined
      return;

    } else {

      // ..else, retrieve index:
      for (i = 0; i < relevantTimestamps.length; i++) {

        currentTimestamp = relevantTimestamps[i];

        if (currentTimestamp >= virtualNow
            && currentTimestamp < virtualNow + stepSize) {
          return i;
        }
      }
    }
  };

  /**
   * Creates svg layer in leaflet's overlaypane and adds current speed/direction
   * as arrows
   *
   * @parameter {object} scope - A ng scope s.t. scope.map is defined
   * @parameter {object} data - Object
   * @return    {object} eventLayer - Leaflet layer object
   */
  createTVLayer = function (scope, data) {

    // if d3currentlayer does not exist atm, create it.
    if (d3TVLayer === undefined) {
      d3TVLayer = L.nonTiledGeoJSONd3(data, {
        ext: 'd3',
        name: 'current',
        selectorPrefix: 'a',
        class: 'current-arrow'
      });
    }

    MapService.addLayer(d3TVLayer);

    // for backwards compatibility.
    d3TVLayer.g = d3TVLayer._container.selectAll("g");
    d3TVLayer.reset = d3TVLayer._onMove;

    return d3TVLayer;
  };

  /**
   * Updates svg layer in leaflet's overlaypane with new data object
   *
   * First call the reset function to give the svg enough space for the
   * new data.Identify path elements with data objects via id and update,
   * create or remove elements.
   *
   * @parameter {object} currentLayer - currentLayer object to update
   * @parameter {object} data - data object
   * @returns {void}
   */
  updateTVLayer = function (tvLayer, data, timeIndex) {
    tvLayer._data = data;
    tvLayer._refreshDataForCurrents(timeIndex);
  };

  return {
    restrict: 'A',
    link: function (scope, element, attrs) {

      var mostRecentTimeindex = 0;

      scope.$watch('timeState.at', function (newVal, oldVal) {

        //console.log('watching: timeState.at (' + scope.timeState.at + ')');

        var tvLayer,
            STEP_SIZE = 300000;

        if (MapService.isMapDefined()) {

          tvLayer = createTVLayer(scope, {
            type: "FeatureCollection",
            features: []
          });
        }

        if (newVal !== oldVal && mustDrawTVLayer()) {

          var tvData,
              timeIndex;

          tvData = getTVData();
          timeIndex = getTimeIndex(scope, tvData, STEP_SIZE);

          if (timeIndex !== undefined) {
            updateTVLayer(tvLayer, tvData, timeIndex);
          }
        }
      });
    }
  };
}]);
