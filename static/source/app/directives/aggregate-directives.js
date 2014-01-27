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

      var eventLayer;

      /**
       * Style event circles based on category and
       * add click event handling
       */
      function circleStyle(features) {
        var scale = d3.scale.ordinal()
            .domain(function (d) {
              return d3.set(d.event_sub_type).values();
            })
            .range(scope.colors[8]);

        features
          .attr('fill-opacity', 0.8)
          .attr('stroke', "#e")
          .attr('stroke-width', 1)
          .attr('fill', function (d) {
            return scale(d.event_sub_type);
          })
          .on('click', function (d) {
            scope.box.type = 'aggregate';
            scope.box.content.eventValue = d;
            scope.$apply();
          });
      }

      /*
       * Reformat time to d3 time formatted object 
       * NOTE: not used because API returns epoch ms.
       */
      function get_time(d) {
        return d3.time(d.timestamp);
      }
      
      /*
       * Draw events based on current temporal extent
       */
      var drawTimeEvents = function (start, end) {
        //NOTE: not optimal class switching
        d3.selectAll(".circle").classed("hidden", true);
        d3.selectAll(".circle")
          .classed("selected", function (d) {
            var s = [start, end];
            var time = d.timestamp;
            var contained = s[0] <= time && time <= s[1];
            // Some book keeping to count
            d.inTempExtent = contained;
            return contained;
          });
        var selected = d3.selectAll(".circle.selected");
        selected.classed("hidden", false);
      };

      // watch for change in temporalExtent, change visibility of
      // alerts accordingly
      scope.$watch('timeState.changedZoom', function () {
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
        //scope.timeState.countCurrentEvents();
      });
      
      // Watch button click, toggle event layer
      var eventLayers = [];
      scope.$watch('timeState.timeline.changed', function () {
        // Fresh start
        angular.forEach(eventLayers, function (layer) {
          mapCtrl.removeLayer(layer);
        });
        for (var eventType in scope.timeState.timeline.data) {
          if (scope.timeState.timeline.data[eventType].active) {
            eventLayer = L.pointsLayer(scope.timeState.timeline.data[eventType], {
              applyStyle: circleStyle
            });
            mapCtrl.addLayer(eventLayer);
            eventLayers.push(eventLayer);
            drawTimeEvents(scope.timeState.start, scope.timeState.end);
          }
        }
      });

      // Watch for animation   
      scope.$watch('timeState.at', function () {
        if (scope.timeState.animation.enabled) {
          drawTimeEvents(scope.timeState.animation.start, scope.timeState.animation.end);
          scope.timeState.countCurrentEvents();
        }
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
        var surface_ids = JSON.parse(e.data.impervious_surfaces);
        if (surface_ids.indexOf("null") === -1) {
          var selector = listToSelector(surface_ids);
          if (e.type === 'mouseover') {
            d3.selectAll(selector)
              .style("stroke", "#f00")
              .style("stroke-width", 1.2)
              .style("fill", "#ddd")
              .style("fill-opacity", 0.6)
              .transition();
          } else if (e.type === 'mouseout') {
            d3.selectAll(selector)
              .transition()
              .duration(3000)
              .style("stroke-width", 0)
              .style("fill-opacity", 0);
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
          if (tmpLayer._url && tmpLayer._url.indexOf(
            layerType + '?object_types=' + entityName) !== -1) {
            layer = tmpLayer;
            break;
          }
        }
        return layer;
      };

      // Initialise geojson layer
      var surfaceLayer = L.geoJSONd3(
        'api/v1/tiles/{z}/{x}/{y}/.geojson?object_types=impervioussurface',
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
        if (scope.tools.active === "pipe_surface") {
          mapCtrl.addLayer(surfaceLayer);
          var pipeLayer = getLayer('grid', 'pipe');
          if (pipeLayer) {
            // icon active
            angular.element(".surface-info").addClass("icon-active");
            pipeLayer.on('mouseover', highlightSurface);
            pipeLayer.on('mouseout', highlightSurface);
          }
        } else {
          var pipeLayer = getLayer('grid', 'pipe');
          if (pipeLayer) {
            // icon inactive
            angular.element(".surface-info").removeClass("icon-active");
            pipeLayer.off('mouseover', highlightSurface);
            pipeLayer.off('mouseout', highlightSurface);
          }
          mapCtrl.removeLayer(surfaceLayer);
        }
      });
    }
  };
});

