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
        if (!scope.timeState.colorScale) {
          scale = d3.scale.ordinal()
            .domain(function (d) {
              return d3.set(d.event_sub_type).values();
            })
            .range(colorbrewer.Set2[6]);
        } else {
          scale = scope.timeState.colorScale;
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
          return scope.timeState.colorScale(d.event_sub_type);
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
        scope.timeState.countCurrentEvents();
      });
      
      // Watch button click, toggle event layer
      var eventLayers = [];
      scope.$watch('timeState.timeline.changed', function () {
        // Fresh start
        angular.forEach(eventLayers, function(layer) {
          mapCtrl.removeLayer(layer);
        });
        for (var eventType in scope.timeState.timeline.data) {
          if (scope.timeState.timeline.data[eventType].active) {
            eventLayer = L.pointsLayer(scope.timeState.timeline.data[eventType], {
                applyStyle: circle_style
              });
            mapCtrl.addLayer(eventLayer);
            eventLayers.push(eventLayer);
            drawTimeEvents(scope.timeState.start, scope.timeState.end);
          }
        }
      });

    // Watch for animation   
    scope.$watch('timeState.at', function () {
      console.log("redraw? ", scope.timeState.animation.enabled);
      if (scope.timeState.animation.enabled) {
        console.log("redraw");
        drawTimeEvents(scope.timeState.animation.start, scope.timeState.animation.end);
        scope.timeState.countCurrentEvents();
      }
    });
    }
  };
});
