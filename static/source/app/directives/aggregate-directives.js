/**
 * Add non tiled d3 event vector layer
 *
 * Implemented as a layer to display point events. Events
 * are aggregated based on viewport (spatial extent) and
 * time-interval (temporal extent, from timeline)
 *
 */
app.directive('vectorlayer', function () {
  return {
    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      /**
       * Creates svg layer in leaflet's overlaypane and adds events as circles
       *
       * On leaflet's viewreset the svg rescaled and repositioned. This function should
       * also be called when the data is changed
       *
       * @parameter: object data object
       * @return: object eventLayer object
       */
      var createEventLayer = function (data) {
        var map = mapCtrl.map();
        var svg = d3.select(map.getPanes().overlayPane).append("svg"),
            g = svg.append("g").attr("class", "leaflet-zoom-hide");
        
        function projectPoint(x, y) {
          var point = map.latLngToLayerPoint(new L.LatLng(y, x));
          this.stream.point(point.x, point.y);
        }

        var transform = d3.geo.transform({point: projectPoint}),
            path = d3.geo.path().projection(transform),
            bounds = path.bounds(data);

        function reset() {
          bounds = path.bounds(data);

          var topLeft = bounds[0],
              bottomRight = bounds[1],
              width = bottomRight[0] - topLeft[0] + 20,
              height = bottomRight[1] - topLeft[1] + 20;

          svg.attr()
             .attr("width", width)
             .attr("height", height)
             // Shift whole viewbox halve a pixel for nice and crisp rendering
             .attr("viewBox", "-0.5 -0.5 " + width + " " + height)
             .style("left", (topLeft[0] - 10) + "px")
             .style("top", (topLeft[1] - 10) + "px");

          g.attr("transform", "translate(" + -(topLeft[0] - 10) + "," + -(topLeft[1] - 10) + ")")
           .selectAll("path").attr("d", path);
        }

        map.on("viewreset", reset);

        var feature = g.selectAll("path")
            .data(data.features, function  (d) { return d.id; });

        feature.enter().append("path")
          .attr("d", path)
          .attr("class", "circle event")
          .attr("fill-opacity", 0)
          .attr('fill', function (d) {
            return d.color;
          })
          .transition()
          .delay(500)
          .duration(1000)
          .attr('fill-opacity', 0.8);

        feature.on('click', function (d) {
            scope.box.type = 'aggregate';
            scope.box.content.eventValue = d;
            scope.$apply();
          });

        reset();
        return {
          g: g,
          svg: svg,
          path: path,
          reset: reset
        };
      };

      /**
       * Updates svg layer in leaflet's overlaypane with new data object
       *
       * First call the reset function to give the svg enough space for the new data.
       * Identify path elements with data objects via id and update, create or remove elements.
       *
       * @parameter: object eventLayer object to update
       * @parameter: data object
       * @return: object eventLayer object
       */
      var updateEventLayer = function (eventLayer, data) {
        eventLayer.reset();
        var feature = eventLayer.g.selectAll("path")
            .data(data.features, function  (d) { return d.id; });

        feature.transition()
          .delay(500)
          .duration(1000)
          .attr('fill', function (d) {
            return d.color;
          });

        feature.enter().append("path")
          .attr("d", eventLayer.path)
          .attr("class", "circle event")
          .attr("fill-opacity", 0)
          .attr('fill', function (d) {
            return d.color;
          })
          .transition()
          .delay(500)
          .duration(1000)
          .attr('fill-opacity', 0.8);

        feature.exit()
          .transition()
          .duration(1000)
          .style("fill-opacity", 1e-6)
          .remove();

        feature.on('click', function (d) {
            scope.box.type = 'aggregate';
            scope.box.content.eventValue = d;
            scope.$apply();
          });
      };

      var removeEventLayer = function (eventLayer) {
        eventLayer.svg.remove();
        return false;
      };

      /**
       * Draw events based on current temporal extent
       *
       * Hide all elements and then unhides when within the given start and end timestamps
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
            var time = d.properties.timestamp;
            var contained = s[0] <= time && time <= s[1];
            // Some book keeping to count
            d.inTempExtent = contained;
            return contained;
          });
        var selected = d3.selectAll(".circle.selected");
        selected.classed("hidden", false);
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
        scope.events.countCurrentEvents();
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
                         scope.timeState.animation.end);
          scope.events.countCurrentEvents();
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
});


/**
 * Impervious surface vector layer
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
        var layer = false,
            tmpLayer = {};
        for (var i in scope.map._layers) {
          tmpLayer = scope.map._layers[i];
          if (tmpLayer.options.name === entityName &&
              tmpLayer.options.ext === layerType) {
            layer = tmpLayer;
            break;
          }
        }
        return layer;
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
       * geojson d3 layer and bind mouseover and mouseout events to 
       * highlight impervious surface.
       *
       */
      scope.$watch('tools.active', function () {
        var pipeLayer = {};
        if (scope.tools.active === "pipeSurface") {
          mapCtrl.addLayer(surfaceLayer);
          pipeLayer = getLayer('grid', 'sewerage');
          // icon active
          angular.element(".surface-info").addClass("icon-active");
          if (pipeLayer) {
            pipeLayer.on('mousemove', highlightSurface);
            pipeLayer.on('mouseout', highlightSurface);
          } else {
            // If there is no grid layer it is probably still being
            // loaded by the map-directive which will broadcast a 
            // message when its loaded. 
            scope.$on('sewerageGridLoaded', function () {
              if (scope.tools.active === 'pipeSurface') {
                pipeLayer = getLayer('grid', 'sewerage');
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
