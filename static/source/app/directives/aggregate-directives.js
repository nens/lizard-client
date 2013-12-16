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
              return d3.set(d.event_sub_type).values();
            })
            .range(colorbrewer.Set2[6]);
        }

        circles.attr('opacity', 0.8)
          .attr('stroke', "#e")
          .attr('stroke-width', 1)
          .attr('fill', function (d) {
            return scale(d.event_sub_type);
          })
          .on('click', function (d) {
            scope.box.content.event = d;
            scope.$digest();
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
        selected.call(countEvents, 'alerts');
      };

      // watch for change in temporalExtent, change visibility of
      // alerts accordingly
      scope.$watch('timeline.temporalExtent.changedZoom', function () {
        drawTimeEvents();
        scope.timeline.countCurrentEvents();
      });

      /*
       * Count events in viewport; update scope with count
       */
      var countEvents = function (selection, type) {
        var ctr = 0;
        var mapBounds = scope.map.getBounds();
        //NOTE: hard coded SRS
        var srs = "EPSG:4326" // L.CRS.EPSG3857.code;
        // // for rasters, also send needed statistic
        // scope.getRasterData("pop_density", scope.mapState.geom_wkt, srs, 'sum');
        // scope.box.pop_density = 1000;
        // var num_citizens = scope.box.pop_density / 100000000;
        //console.log(num_citizens);
        // timeInterval in months
        var timeInterval = ((scope.timeline.temporalExtent.end -
                             scope.timeline.temporalExtent.start)
                             // (1000 * 60 * 60 * 24 * 30)
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
        //scope.box.content[type].content_agg = ctr / num_citizens / timeInterval;
      };
      
      // Watch button click, toggle event layer
      var eventLayers = [];
      scope.$watch('timeline.changed', function () {
        // Fresh start
        angular.forEach(eventLayers, function(layer) {
          mapCtrl.removeLayer(layer);
        });
        for (var eventType in scope.timeline.data) {
          console.log(eventType, scope.timeline.data);
          if (scope.timeline.data[eventType].active) {
            eventLayer = L.pointsLayer(scope.timeline.data[eventType], {
                applyStyle: circle_style
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
