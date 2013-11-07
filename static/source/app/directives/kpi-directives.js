app.directive('kpilayer', function () {
  return {
    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      // init vars
      var areas = {};
      var styler = function (feature) {
        var style = {};
        style.fillOpacity = 0.4;
        style.fillColor = '#1a9850';
        style.color = '#1a9850';
        style.weight = 1;
        var kpi_cat = feature.properties[scope.kpi.slct_cat];
        var val_index = kpi_cat.dates.indexOf(scope.kpi.slct_date);
        var test_val = kpi_cat.values[val_index];
        if (test_val === 0) {
          style.fillColor = '#EEE';
          style.color = '#EEE';
        } else if (test_val < scope.kpi.thresholds.warning &&
            test_val > scope.kpi.thresholds.error) {
          style.fillColor = '#F87217';
          style.color = '#F87217';
        } else if (test_val <= scope.kpi.thresholds.error) {
          style.fillColor = '#d73027';
          style.color = '#d73027';
        }
        if (feature.properties.name === scope.kpi.slct_area) {
          style.fillOpacity = 0.8;
          style.weight = 5;
        }
        return style;
      };

      // NOTE: commented out to abuse button for vector layer
      //scope.$watch('tools.kpi.enabled', function () {
        //if (scope.tools.kpi.enabled){
          //scope.box.type = 'kpi';      
        //} else {
          //mapCtrl.removeLayer(areas);
        //}
      //});

      scope.$watch('kpi.kpiData', function () {
        // remove previous layer if available
        if (areas !== undefined) {
          mapCtrl.removeLayer(areas);
        }
        if (scope.kpi.kpiData.features !== undefined) {
          areas = L.geoJson(scope.kpi.kpiData, {
            onEachFeature: function (feature, layer) {
              var array, key, value;
              array = (function () {
                var ref, results;
                ref = feature.properties;
                results = [];
                for (var key in ref) {
                  value = ref[key];
                  results.push("" + key + ": " + value);
                }
                return results;
              })();
              layer.on('click', function (e) {
                scope.onAreaClick(value);
              });
            },
            style: styler
          });
          mapCtrl.addLayer(areas);
        }
      });

      scope.$watch('kpi.kpichanged', function () {
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.thresholds.warning', function () {
        // set style
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.thresholds.error', function () {
        // set style
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.clean', function () {
        mapCtrl.removeLayer(areas);
      });
    }
  };
});

/*
 * Directive to add d3 vector layers as a leaflet
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
        scope.get_profile("pop_density", geom_wkt, srs);
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
        scope.box.content = ctr;
        //NOTE: ugly hack
        scope.box.content_agg = ctr / num_citizens / timeInterval;
      };
      
      /*
       * Draw events based on current temporal extent
       */
      var drawTimeEvents = function () {
        d3.selectAll(".circle")
          .classed("selected", function (d) {
            var s = [scope.timeline.temporalExtent.start,
                     scope.timeline.temporalExtent.end];
            // + is a d3 operator to convert time objects to ms
            var time = +get_time(d);
            return s[0] <= time && time <= s[1];
          });
        d3.selectAll(".circle.selected").call(countEvents);
      }

      // watch for change in temporalExtent, change visibility of
      // complaints accordingly
      scope.$watch('timeline.temporalExtent.changedZoom', function () {
        // NOTE: there's three functions now that do a check on 
        // scope.tools.kpi.enabled; fix
        if (scope.tools.kpi.enabled) {
          drawTimeEvents();
        }
      });

      // Count events on map move
      scope.$watch('mapState.moved', function () {
        if (scope.tools.kpi.enabled) {
          d3.selectAll(".circle.selected").call(countEvents);
        }
      });
      
      // Watch button click, toggle event layer
      scope.$watch('tools.kpi.enabled', function () {
        scope.box.type = "aggregate";
        if (scope.tools.kpi.enabled) {
          eventLayer = L.pointsLayer(scope.kpi.events, {
            applyStyle: circle_style
          });
          mapCtrl.addLayer(eventLayer);
          drawTimeEvents();
          console.log(d3.select("#timeline"));
          d3.select("#timeline").classed("hidden", false);
        } else {
          mapCtrl.removeLayer(eventLayer);
          d3.select("#timeline").classed("hidden", true);
        }
      });
    }
  };
});
