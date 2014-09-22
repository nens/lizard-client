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
          locationIdExtractor, createEventLayer, d3eventLayer, _highlightEvents;

      /**
       * Get color from feature.
       *
       * @param {object} d - D3 bound data object; expects color property.
       */
      getEventColor = function (d) {
        return d.properties.color;
      };

      /**
       * Highlights and unhighlights event points.
       *
       * Highlighting is done based on location. Every event with the same
       * location class gets highlighted.
       *
       * @param {string} locationId - Location class that should be highlighted.
       */
      _highlightEvents = function (locationId) {
        // unhighlight events
        d3.selectAll(".circle.event")
          .classed("highlighted-event", false)
          .attr("data-init-color", getEventColor)
          .attr("fill", getEventColor);

        // highlight selected event
        d3.selectAll("." + locationId)
          .classed("highlighted-event", true)
          .transition()
          .duration(200);
          // .attr("fill", "black");

        // hacky hack is oooow soooo hacky
        setTimeout(function () {
          ClickFeedbackService.removeLocationMarker();
        }, 300);

      };

      /**
       * Event click handler.
       *
       * Gets id's highlights events, matchesLocations and passes them to
       * 'here' object. For pointObject to pick 'em up.
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
          if (scope.box.type !== 'pointObject') {
            scope.box.type = 'pointObject';
            scope.mapState.here = here;
          }
        };

        if (!scope.$$phase) {
          scope.$apply(setEventOnPoint);
        } else {
          setEventOnPoint();
        }

        $rootScope.$broadcast('updatePointObject', eventDatastuff);
      };

      /**
       * Gets data point and searches through list of geojson features for
       * matches. Returns matchedLocations
       *
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
       * Utilfunction that creates/returns a "feature".
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
       * Extract location id's from GeoJSON.
       *
       * Each location gets the same id. Useful for selecting overlapping
       * features by CSS class.
       *
       * @param  {object} feature - GeoJSON feature.
       * @return {string} - Generated id.
       */
      locationIdExtractor = function (feature) {

        var id = feature.geometry.coordinates[0].toString().replace('.', '_') +
                 feature.geometry.coordinates[1].toString().replace('.', '_');

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
            idExtractor: locationIdExtractor,
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
       * Draw events based on current temporal extent.
       *
       * Hide all elements and then unhides when within the given start and end
       * timestamps.
       *
       * @parameter: int start start timestamp in epoch ms
       * @parameter: int end end timestamp in epoch ms
       */
      var drawTimeEvents = function (start, end) {
        //NOTE: not optimal class switching
        d3.selectAll(".circle").classed("hidden", true);
        d3.selectAll(".circle")
          .classed("withinbounds", function (d) {
            var s = [start, end];
            var time = d.properties.timestamp_end;
            var contained = s[0] <= time && time <= s[1];

            // Some book keeping to count
            d.inTempExtent = contained;
            return !!contained;
          });
        var withinbounds = d3.selectAll(".circle.withinbounds");
        scope.events.withinBounds = withinbounds[0].length;

        // hack to update radius of event circles on brush move
        // duplicate code with Layer.GeoJSONd3.js
        // TODO: refactor this code into above fill for update of d3 selection
        var overlapLocations = {};
        withinbounds.classed("hidden", false);
        withinbounds
          .attr("r", function (d) {
            var radius, overlaps;
            overlaps = _countOverlapLocations(overlapLocations, d);
            // logarithmic scaling with a minimum radius of 6
            d.properties.number_events_location = overlaps;
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
       * Watch that is fired when the animation has stepped.
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
          if (surface_ids !== null && surface_ids.indexOf("null") === -1) {
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

/**
 * Add non-tiled d3 vector layer for currents.
 *
 * Implemented as a layer to display current speed/direction on the map.
 */
app.directive('temporalVectorLayer', ['UtilService', 'MapService', 'TemporalVectorService',
  function (UtilService, MapService, TemporalVectorService) {

  return {
    restrict: 'A',
    link: function (scope, element, attrs) {

      var tvLayer,
          tvData = TemporalVectorService.getTVData(),
          setWatches,
          watches = [];

      /**
       * @description - Unconditional watch: is triggered normally, when the flow layer
       *                doesn't exist this does NOT raise an error.
       */
      scope.$watch('mapState.layers.flow.active', function (newVal, oldVal) {

        if (newVal === oldVal) { return; }
        if (newVal) {

          if (!tvLayer && MapService.isMapDefined()) {
            tvLayer = TemporalVectorService.createTVLayer(scope, {
              type: "FeatureCollection",
              features: []
            });
          }
          watches = setWatches();

        } else {
          // De-register watches
          angular.forEach(watches, function (watch) {
            watch();
          });
          return;
        }
        TemporalVectorService.clearTVLayer();
        if (newVal && scope.timeState.hidden !== false) {
          scope.toggleTimeline();
        }
        TemporalVectorService.getTimeIndexAndUpdate(scope, tvLayer, tvData);
      });

      /**
       * @function
       * @description - Makes watches only listen when applicable.
       * @returns {object[]} - An array of watches, which are now toggable.
       */
      setWatches = function () {

        watches.push(scope.$watch('timeState.at', function (newVal, oldVal) {

          if (newVal === oldVal) { return; }

          else if (scope.timeState.animation.playing
            && (newVal > oldVal + TemporalVectorService.STEP_SIZE
              || newVal < oldVal)) {

            TemporalVectorService.resetTimeIndex();
          }

          TemporalVectorService.getTimeIndexAndUpdate(
            scope,
            tvLayer,
            tvData
          );
        }));


        watches.push(scope.$watch('mapState.zoom', function (newVal, oldVal) {

          if (newVal === oldVal) { return; }

          TemporalVectorService.clearTVLayer();
          TemporalVectorService.getTimeIndexAndUpdate(scope, tvLayer, tvData);
        }));


        watches.push(scope.$watch('timeState.animation.playing', function (newVal, oldVal) {

          if (newVal === oldVal) { return; }

          TemporalVectorService.resetTimeIndex();
        }));

        return watches;
      };
    }
  };
}]);
