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

      var eventLayer;

      /*
       * Style event circles based on category and
       * add click event handling
       */
      function circle_style(circles) {
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

        circles.attr('fill-opacity', 0.8)
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
        console.log("setting color");
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
        angular.forEach(eventLayers, function(layer) {
          mapCtrl.removeLayer(layer);
        });
        for (var eventType in scope.timeline.data) {
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
