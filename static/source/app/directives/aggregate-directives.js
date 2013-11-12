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
       * Count events in viewport; update scope with count
       */
      var countEvents = function (selection) {
        var ctr = 0;
        var mapBounds = scope.map.getBounds();
        geom_wkt = "POLYGON(("
                  + mapBounds.getWest() + " " + mapBounds.getSouth() + ", "
                  + mapBounds.getEast() + " " + mapBounds.getSouth() + ", "
                  + mapBounds.getEast() + " " + mapBounds.getNorth() + ", "
                  + mapBounds.getWest() + " " + mapBounds.getNorth() + ", "
                  + mapBounds.getWest() + " " + mapBounds.getSouth()
                  + "))";
        //NOTE: hard coded SRS
        var srs = "EPSG:4326" // L.CRS.EPSG3857.code;
        // NOTE: in progress, this should be get_data
        // for rasters, also send needed statistic
        scope.getRasterData("pop_density", geom_wkt, srs, 'sum');
        var num_citizens = scope.box.pop_density / 100000000;
        console.log(num_citizens);
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
        scope.box.content.count = ctr;
        //NOTE: ugly hack
        scope.box.content_agg = ctr / num_citizens / timeInterval;
      };
      
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
        selected.call(countEvents);
      }

      // watch for change in temporalExtent, change visibility of
      // alerts accordingly
      scope.$watch('timeline.temporalExtent.changedZoom', function () {
        drawTimeEvents();
      });

      // Count events on map move
      scope.$watch('mapState.moved', function () {
        d3.selectAll(".circle.selected").call(countEvents);
      });
      
      // Watch button click, toggle event layer
      scope.$watch('tools.alerts.enabled', function () {
        if (scope.tools.alerts.enabled) {
          scope.box.type = "aggregate";
          // NOTE: remove this and make generic
          // removing sewerage things ..
          scope.box.sewerage = undefined;
          for (mapLayer in scope.mapState.layers) {
            layer = scope.mapState.layers[mapLayer];
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
          // NOTE: do this somewhere else
          // set timeline data 
          scope.timeline.data = scope.kpi[0].pi[0].data.features;

          scope.timeline.changed = !scope.timeline.changed;
          scope.timeline.enabled = true;

          // d3.select("#timeline").classed("hidden", false);
        } else {
          //mapCtrl.removeLayer(eventLayer);
          d3.selectAll(".circle").classed("hidden", true);
          // d3.select("#timeline").classed("hidden", true);
        }
      });
    }
  };
});
