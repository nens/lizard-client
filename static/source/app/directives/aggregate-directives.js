/*
 * Directive to add d3 vector layer to leaflet
 *
 * This is implemented as a layer to display point events. Events
 * are aggregated based on viewport (spatial extent) and
 * time-interval (temporal extent, from timeline)
 *
 */
app.directive('vectorlayer', function () {
  return {
    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      var scale,
          eventLayer;

      /*
       * Style event circles based on category and
       * add click event handling
       */
      function circle_style(circles) {
        if (!scale) {
          scale = d3.scale.ordinal()
            .domain(function (d) {
              //NOTE: kill hard coded dependency
              return d3.set(d.properties.CATEGORIE).values();
            })
            .range(colorbrewer.Set2[6]);
        }

        circles.attr('opacity', 0.8)
          .attr('stroke', "#e")
          .attr('stroke-width', 1)
          .attr('fill', function (d) {
            return scale(d.properties.CATEGORIE);
          });

        // click handler
        circles.on("mouseenter", function (d, i) {
          L.DomEvent.stopPropagation(d3.event);

          // NOTE: kill hard coded dependencies
          // do we actually want a popup?
          var data = {
            klacht: d.properties.KLACHT,
            category: d.properties.CATEGORIE,
            intakestatus: d.properties.INTAKESTAT
          };

          var t = "<h3>" + data.category + "</h3>";

          var popup = L.popup()
            .setLatLng([d.geometry.coordinates[1], d.geometry.coordinates[0]])
            .setContent(t)
            .openOn(scope.map);
          window.setTimeout(function () {scope.map.closePopup();}, 1500);
        });
      }

      /*
       * Reformat time to d3 time formatted object
       */
      function get_time(d) {
        return d3.time.format.iso.parse(d.properties.INTAKEDATU);
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
            // + is a d3 operator to convert time objects to ms
            var time = +get_time(d);
            return s[0] <= time && time <= s[1];
          });
        var selected = d3.selectAll(".circle.selected");
        selected.classed("hidden", false);
        selected.call(countEvents, 'alerts');
      }

      /**
       * Update sewerage classes based on current temporal extent
       * NOTE: temporary function until we have a dedicated 
       * events mechanism
       */
      var updateSewerage = function () {
        // loop over sewerages to get id of sewerage over threshold
        d3.selectAll(".pumpstation_sewerage")
          .classed("exceeded", false);
        var s = [scope.timeline.temporalExtent.start,
                 scope.timeline.temporalExtent.end];
        for (var i = 0; i < scope.formatted_geojsondata.length; i++) {
          var sewerage = scope.formatted_geojsondata[i];
          var time = +sewerage.date;
          if (s[0] <= time && time <= s[1]) {
            d3.select("#pumpstation_" + sewerage.value)
              .classed("exceeded", true);
          }
        }
      }

      // watch for change in temporalExtent, change visibility of
      // alerts accordingly
      scope.$watch('timeline.temporalExtent.changedZoom', function () {
        drawTimeEvents();
        updateSewerage();
      });

      /*
       * Count events in viewport; update scope with count
       */
      var countEvents = function (selection, type) {
        var ctr = 0;
        var mapBounds = scope.map.getBounds();
        var geom_wkt = "POLYGON(("
                  + mapBounds.getWest() + " " + mapBounds.getSouth() + ", "
                  + mapBounds.getEast() + " " + mapBounds.getSouth() + ", "
                  + mapBounds.getEast() + " " + mapBounds.getNorth() + ", "
                  + mapBounds.getWest() + " " + mapBounds.getNorth() + ", "
                  + mapBounds.getWest() + " " + mapBounds.getSouth()
                  + "))";
        //NOTE: hard coded SRS
        var srs = "EPSG:4326" // L.CRS.EPSG3857.code;
        // for rasters, also send needed statistic
        //scope.getRasterData("pop_density", geom_wkt, srs, 'sum');
        scope.box.pop_density = 1000;
        var num_citizens = scope.box.pop_density / 100000000;
        //console.log(num_citizens);
        // timeInterval in months
        var timeInterval = ((scope.timeline.temporalExtent.end -
                             scope.timeline.temporalExtent.start)
                             / (1000 * 60 * 60 * 24 * 30)
                             );
        selection.each(function (d) {
          var point = new L.LatLng(d.geometry.coordinates[1],
                                   d.geometry.coordinates[0]);
          // NOTE: check if we can optimise this function
          if (mapBounds.contains(point)) {
            ctr += 1;
          }
        });
        // pass newly calculated data to scope
        scope.box.content[type].count = ctr;
        //NOTE: ugly hack
        scope.box.content[type].content_agg = ctr / num_citizens / timeInterval;
      };

      /*
       * Count events in viewport; update scope with count
       */
      var countEventsISW = function (selection, type) {
        var ctr = 0;
        var mapBounds = scope.map.getBounds();

        var features = scope.rawGeojsondata.features;
        var length = features.length;
        for (var i = 0; i < length; i++) {
          var d = features[i];
          if (d.properties.events) {
            var point = new L.LatLng(d.geometry.coordinates[1],
                                     d.geometry.coordinates[0]);
            if (mapBounds.contains(point)) {
              ctr += 1;
            }
          }
        };
        // pass newly calculated data to scope
        scope.box.content[type].count = ctr;
      };

      // Count events on map move
      scope.$watch('mapState.moved', function () {
        d3.selectAll(".circle.selected").call(countEvents, 'alerts');
        var select = d3.selectAll(".pumpstation_sewerage").call(countEventsISW, 'isw');
        //NOTE: ugly hack to resize sewerages
        var zoom = scope.map.getZoom();
        var fontSize = zoom / 16 * 54 + "px";
        //console.log(fontSize);
        if (zoom >= 13) {
          select
            .classed("hidden", false)
            .style("font-size", fontSize);
        } else {
          select.classed("hidden", true);
        }
      });
      
      // Watch button click, toggle event layer
      scope.$watch('tools.active', function () {
        if (scope.tools.active === "alerts") {
          scope.box.type = "aggregate";
          // NOTE: remove this and make generic
          // removing sewerage things ..
          scope.box.sewerage = undefined;
          for (var mapLayer in scope.mapState.layers) {
            var layer = scope.mapState.layers[mapLayer];
            if (layer.name === 'Riolering') {
              layer.active = false;
              scope.mapState.changed = Date.now();
            }
          }

          if (scope.kpi[0].pi[0].loaded === undefined || scope.kpi[0].pi[0].loaded === false) {
            if (scope.kpi[0].pi[0].data){
            }
            eventLayer = L.pointsLayer(scope.kpi[0].pi[0].data, {
                applyStyle: circle_style
              });  
            mapCtrl.addLayer(eventLayer);
            drawTimeEvents();
            scope.kpi[0].pi[0].loaded = true;
          }

          d3.selectAll(".circle.selected").classed("hidden", false);
          // set timeline data 
          scope.timeline.data = scope.kpi[0].pi[0].data.features;

        } else {
          d3.selectAll(".circle").classed("hidden", true);
        }
      });
    }
  };
});
