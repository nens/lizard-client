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
        var scale;
        if (!scope.timeline.colorScale) {
          scale = d3.scale.ordinal()
            .domain(function (d) {
              return d3.set(d.event_sub_type).values();
            })
            .range(colorbrewer.Set2[6]);
        } else {
          scale = scope.timeline.colorScale;
        }

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

      scope.$watch('timeline.colorScale', function () {
        d3.selectAll(".circle")
        .attr('fill', function (d) {
          return scope.timeline.colorScale(d.event_sub_type);
        });
      });

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
      var drawTimeEvents = function () {
        //NOTE: not optimal class switching
        d3.selectAll(".circle").classed("hidden", true);
        d3.selectAll(".circle")
          .classed("selected", function (d) {
            var s = [scope.timeline.temporalExtent.start,
                     scope.timeline.temporalExtent.end];
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
      scope.$watch('timeline.temporalExtent.changedZoom', function () {
        drawTimeEvents();
        scope.timeline.countCurrentEvents();
      });
      
      // Watch button click, toggle event layer
      var eventLayers = [];
      scope.$watch('timeline.changed', function () {
        // Fresh start
        angular.forEach(eventLayers, function (layer) {
          mapCtrl.removeLayer(layer);
        });
        for (var eventType in scope.timeline.data) {
          if (scope.timeline.data[eventType].active) {
            eventLayer = L.pointsLayer(scope.timeline.data[eventType], {
                applyStyle: circleStyle
              });
            mapCtrl.addLayer(eventLayer);
            eventLayers.push(eventLayer);
            drawTimeEvents();
          }
        }
      });
    }
  };
});


/**
 * Impervious surface vector layer
 *
 * Load data with d3 geojson vector plugin L.TileLayer.GeoJSONd3 in ./lib
 *
 */
app.directive('surfacelayer', function () {
  return {
    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      /**
       * Style surface features
       */
      var surfaceStyle = function (features) {
        features
          .style("stroke-width", 0)
          .style("fill-opacity", 0);
      };

      // define geojson layer
      var surfaceLayer = L.geoJSONd3(
        'api/v1/tiles/{z}/{x}/{y}/.geojson?object_types=impervioussurface',
        {
          applyStyle: surfaceStyle,
          class: "impervious_surface"
        });
      console.log(surfaceLayer);

      /**
       * Convert list with values to d3 selector
       * 
       * @param: list of values
       * @returns: concatenated d3 suitable OR selector
       */
      var listToSelector = function (list) {
        var selector = "";
        for (var i in list) {
          selector += ".p" + list[i] + ", ";
        }
        selector = selector.slice(0, -2);

        return selector;
      };

      /**
       * Highlight surfaces connected to pipe
       *
       * @param: surface_ids, list of ids of features to highlight
       */
      var highlightSurfaceEnter = function (surface_ids) {
        var selector = listToSelector(surface_ids);
        d3.selectAll(selector)
          .style("stroke", "#f00")
          .style("stroke-width", 1.2)
          .style("fill", "#ddd")
          .style("fill-opacity", 0.6)
          .transition();
      };

      /**
       * Fade surfaces connected to pipe
       * 
       * @param: surface_ids, list of ids of features to fade
       */
      var highlightSurfaceExit = function (surface_ids) {
        var selector = listToSelector(surface_ids);
        d3.selectAll(selector)
          .transition()
          .duration(3000)
          .style("stroke-width", 0)
          .style("fill-opacity", 0);
      };

      /**
       * Add geojson d3 layer
       *
       */
      scope.$watch('tools.active', function () {
        if (scope.tools.active === "pipe_surface") {
          mapCtrl.addLayer(surfaceLayer);
          // get pipe UTFgrid layer
          // this is why I don't like leaflet: there is no simple method
          // to get a layer from the map object by name or even id
          var pipeLayer = false,
              layer = {};
          for (var i in scope.map._layers) {
            layer = scope.map._layers[i];
            if (layer._url && layer._url.indexOf('grid?object_types=pipe') !== -1) {
              pipeLayer = layer;
              break;
            }
          }
          if (pipeLayer) {
            pipeLayer.on('mouseover', function (e) {
              var surface_ids = JSON.parse(e.data.impervious_surfaces);
              if (surface_ids.indexOf("null") === -1) {
                highlightSurfaceEnter(surface_ids);
              }
            });

            pipeLayer.on('mouseout', function (e) {
              var surface_ids = JSON.parse(e.data.impervious_surfaces);
              if (surface_ids.indexOf("null") === -1) {
                highlightSurfaceExit(surface_ids);
              }
            });
          }
        } else {
          // unregister event handlers and remove geojson layer
          console.log("remove layer");
          console.log(surfaceLayer);
          mapCtrl.removeLayer(surfaceLayer);
        }
      });
    }
  };
});

