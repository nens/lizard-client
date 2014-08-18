/**
 * Add non tiled d3 event vector layer
 *
 * Implemented as a layer to display point events. Events
 * are aggregated based on viewport (spatial extent) and
 * time-interval (temporal extent, from timeline)
 *
 */
app.directive('vectorlayer', ["EventService", "$rootScope",
  function (EventService, $rootScope) {

  return {
    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      // declaring all local vars for current scope:
      var getEventColor, eventClickHandler, getFeatureSelection, matchLocation,
          idExtractor, createEventLayer, d3eventLayer, highlightEvents;

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
       * @param  {string} - String with id that should be highlighted
       */
      highlightEvents = function (id) {
        // unhighlight events
        d3.selectAll(".circle.event")
          .attr("fill", getEventColor);
        // highlight selected event
        d3.select("." + id).transition()
          .duration(1000)
          .attr("fill", "black");
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

        highlightEvents(id);

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

        map = scope.map;

        // if d3eventlayer does not exist create.
        if (d3eventLayer === undefined) {
          d3eventLayer = L.nonTiledGeoJSONd3(data, {
            ext: 'd3',
            name: 'events',
            selectorPrefix: 'm',
            // idExtractor: idExtractor,
            class: 'circle event'
          });
        }

        map.addLayer(d3eventLayer);
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
        scope.map.removeLayer(eventLayer);
        return false;
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
        selected.classed("hidden", false);
        EventService.countCurrentEvents(scope.mapState.eventTypes,
                                        scope.events);
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
        EventService.countCurrentEvents(scope.mapState.eventTypes,
                                        scope.events);
      });

      scope.$watch('events.changed', function (n, o) {
        if (n === o) { return true; }
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
        EventService.countCurrentEvents(scope.mapState.eventTypes,
                                        scope.events);
      });

      /**
       * Watch that is fired when the animation has stepped
       *
       * Calls functions to draw events currently within the animation bounds
       * and to count currently visible events
       */
      scope.$watch('timeState.at', function () {
        if (scope.timeState.animation.enabled) {
          drawTimeEvents(scope.timeState.animation.start,
                         scope.timeState.at);
          EventService.countCurrentEvents(scope.mapState.eventTypes,
                                          scope.events);
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
app.directive('surfacelayer', function () {
  return {
    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

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

      /**
       * Get layer from leaflet map object.
       *
       * Because leaflet doesn't supply a map method to get a layer by name or
       * id, we need this crufty function to get a layer.
       *
       * NOTE: candidate for (leaflet) util module
       *
       * @layerType: layerType, type of layer to look for either `grid`, `png`
       * or `geojson`
       * @param: entityName, name of ento
       * @returns: leaflet layer object or false if layer not found
       */

      var getLayer = function (layerType, entityName) {

        var k, opts;

        for (k in scope.map._layers) {
          opts = scope.map._layers[k].options;
          if (opts.name === entityName && opts.ext === layerType) {
            return scope.map._layers[k];
          }
        }
        return false;
      };

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
          mapCtrl.addLayer(surfaceLayer);
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
          mapCtrl.removeLayer(surfaceLayer);
        }
      });
    }
  };
});
