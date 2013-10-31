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

      scope.$watch('tools.kpi.enabled', function () {
        if (scope.tools.kpi.enabled) {
          //scope.box.type = 'kpi';      
        } else {
          mapCtrl.removeLayer(areas);
        }
      });

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
 */
app.directive('vectorlayer', function () {
  return {


    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {


      /*
       * Style complaint circles on category
       * add click event handling
       *
       */

      var extent, scale;
      function circle_style(circles) {
        if (!(extent && scale)) {
          //extent = d3.extent(circles.data(), function (d) {
             //return d.properties.depth;
          //});
          extent = [0, 5],
          scale = d3.scale.category20()
            .domain(["GRONDWATER", "PUT STUK"]);
        }

        circles.attr('opacity', 0.6)
          .attr('stroke', "#e")
          .attr('stroke-width', 1)
          .attr('fill', function (d) {
            return scale(d.properties.CATEGORIE);
          });

        /*
         * Click handler: catch clicks on d3 elements and show popup in leaflet
         */
        circles.on('click', function (d, i) {
          L.DomEvent.stopPropagation(d3.event);

          var data = {
            //id: d.id,
            klacht: d.properties.KLACHT,
            category: d.properties.CATEGORIE,
            intakestatus: d.properties.INTAKESTAT
          };

          var t = "<h3>" + data.category + "</h3>" +
            "<ul>" +
              "<li>Klacht:" + data.klacht + "</li>" +
              "<li>Intakestatus:" + data.intakestatus + "</li>" +
            "</ul>";

          var popup = L.popup()
            .setLatLng([d.geometry.coordinates[1], d.geometry.coordinates[0]])
            .setContent(t)
            .openOn(scope.map);
        });
      }

      /*
       * Watch for event data; display as point vector layer
       */
      scope.$watch('kpi.events', function () {

        var eventLayer = L.pointsLayer(scope.kpi.events, {
          applyStyle: circle_style
        });
        mapCtrl.addLayer(eventLayer);

        function get_time(d) {
          return d3.time.format.iso.parse(d.properties.INTAKEDATU);
        }

        scope.$watch('timeline.temporalExtent.start', function () {
          d3.selectAll(".circle")
            .classed("selected", function (d) {
              var s = [scope.timeline.temporalExtent.start,
                       scope.timeline.temporalExtent.end];
              // + is a d3 operator to convert time objects to ms
              var time = +get_time(d);
              return s[0] <= time && time <= s[1];
            });
          //count selected elements in boundingbox
          d3.selectAll(".circle.selected").call(countEvents);
        });

        var countEvents = function (selection) {
          var ctr = 0;
          var num_citizens = 1;
          var mapBounds = scope.map.getBounds();
          // timeInterval in months
          var timeInterval = ((scope.timeline.temporalExtent.end -
                               scope.timeline.temporalExtent.start)
                               / (1000 * 60 * 60 * 24 * 30));
          console.log(timeInterval);
          selection.each(function (d) {
            var point = new L.LatLng(d.geometry.coordinates[1],
                                     d.geometry.coordinates[0]);
            if (mapBounds.contains(point)) {
              ctr += 1;
            }
            scope.$apply(function () {
              scope.box.content = ctr;
              //NOTE: ugly hack
              scope.box.content_agg = ctr / num_citizens / timeInterval;
            });
          });
        };

        scope.box.type = "aggregate";
        scope.map.on('moveend', function () {
          d3.selectAll(".circle.selected").call(countEvents);
        });
      });
    }
  };
});
