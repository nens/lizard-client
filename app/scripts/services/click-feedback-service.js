
/**
 * Service to draw click feedback.
 */
angular.module('lizard-nxt')
  .service('ClickFeedbackService', ['$rootScope', 'LeafletService',
  function ($rootScope, LeafletService) {
    var ClickLayer = function () {

      var getRadius = function (feature) {
        var entityName = feature.properties.entity_name;
        var radius = feature.properties.radius || 0;
        if (entityName) {
          radius = 12;
          if (entityName.indexOf("pumpstation_non_sewerage") !== -1) {
            radius =  13;
          } else if (entityName.indexOf("pumpstation_sewerage") !== -1
            || entityName.indexOf("weir") !== -1) {
            radius =  11;
          } else if (entityName.indexOf("bridge") !== -1) {
            radius =  14;
          } else if (entityName === 'manhole') {
            radius =  14;
          }
        }
        return radius;
      };

      /**
       * Remove any existing click layers and creates a new empty one.
       *
       * @param {object} map
       */
      this.emptyClickLayer = function (mapState) {
        if (this.clickLayer) {
          mapState.removeLayer(this.clickLayer);
        }

        this.clickLayer = LeafletService.geoJson(null, {
          style: function (feature) {
            return {
              name: 'click',
              clickable: true,
              color: '#34495e',
              stroke: '#34495e',
              opacity: 0.8,
              'stroke-opacity': 0.8,
              radius: getRadius(feature),
            };
          }
        });

        var self = this;
        this.clickLayer.options.pointToLayer = function (feature, latlng) {
          var circleMarker = L.circleMarker(latlng, {
            radius: 0,
            weight: 5,
            fill: false,
            zIndexOffset: 1000,
            clickable: true
          });
          self._circleMarker = circleMarker;
          return circleMarker;
        };

        // Hack to make click on the clicklayer bubble down to the map
        this.clickLayer.on('click', function (e) {
            this._map.fire('click', e);
          }
        );

        mapState.addLayer(this.clickLayer);
      };

      /**
       * Returns the svg as a d3 selection of leaflet layer.
       *
       * @param  {object} layer
       * @return {object} the svg of the leaflet object layer
       */
      this._getSelection = function (layer) {
        // Due to some leaflet obscurity you have to get the first item with an
        // unknown key.
        var _layers = layer._layers;
        var selection;
        for (var key in _layers) {
          selection = d3.select(_layers[key]._container);
          break;
        }
        return selection;
      };

      this.drawFeature = function (geojson) {
        this.clickLayer.addData(geojson);
      };

      this.drawLineElement = function (first, second, dashed) {
        var geojsonFeature = { "type": "Feature" };
        geojsonFeature.geometry = {
          "type": "LineString",
          "coordinates": [[first.lng, first.lat], [second.lng, second.lat]]
        };
        this.clickLayer.options.style = {
          color: '#34495e',
          weight: 2,
          opacity: 1,
          smoothFactor: 1
        };
        if (dashed) {
          this.clickLayer.options.style.dashArray = "5, 5";
        }
        this.clickLayer.addData(geojsonFeature);
      };

      this.vibrateFeatures = function () {
        var sel = this._selection = this._getSelection(this.clickLayer);
        clearInterval(this._vibration);
        this._vibration = setInterval(function () {vibrate(sel, false)}, 400);
      };

      var vibrate = function (sel, remove) {
        var width = Number(sel.select('path').attr("stroke-width"));
        sel.select("path")
          .classed("vibrator", true)
          .attr("stroke-width", function () { return width * 2; })
          .transition().duration(200)
          .attr("stroke-width", function () { return width * 3; })
          .transition().duration(200)
          .attr("stroke-width", function () { return remove ? 0 : width; });
      };

      this.vibrateOnce = function (geojson) {
        var sel = this._selection = this._getSelection(this.clickLayer);
        var remove = false;
        if (geojson) {
          this.clickLayer.addData(geojson);
          sel = this._selection = this._getSelection(this.clickLayer);
          remove = true;
        }
        vibrate(sel, remove);
      };

      this.removeLocationMarker = function () {
        d3.select(".location-marker").remove();
      };

      this.addLocationMarker = function (mapState, latLng) {
        var point = mapState.latLngToLayerPoint(latLng);
        var selection = this._getSelection(this.clickLayer);
        // This is a location marker
        var path = "M" + point.x + " " + (point.y - 32) +
                   "c-5.523 0-10 4.477-10 10 0 10 10 22 10 " +
                   " 22s10-12 10-22c0-5.523-4.477-10-10-10z" +
                   "M" + point.x + " " + (point.y - 16) +
                   "c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z";
        selection.select("path")
          .classed("location-marker", true)
          .attr("d", path)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 1.5)
          .attr("stroke", "white")
          .attr("fill", "#34495e")
          .attr("fill-opacity", "1");
      };
    };

    var clickLayer = new ClickLayer(),
        emptyClickLayer,
        drawCircle,
        drawArrow,
        drawLine,
        drawGeometry,
        startVibration,
        vibrateOnce;


    /**
     * Wrapper for emptyClickLayer, as defined in the above
     * ClickLayer.
     *
     */
    emptyClickLayer = function (mapState) {
      clickLayer.emptyClickLayer(mapState);
    };

    /**
     * Draws visible feedback on the map after a click.
     *
     * Removes possible click feedback layer and creates a new clickLayer
     * containing a circle.
     *
     * @param {object} latLng Leaflet object specifying the latitude
     * and longitude of a click
     */
    drawCircle = function (mapState, latlng) {
      clickLayer.emptyClickLayer(mapState);
      var geometry = {
        "type": "Point",
        "coordinates":
          [latlng.lng, latlng.lat]
      };
      clickLayer.drawFeature(geometry);
    };

    drawGeometry = function (mapState, geometry, entityName) {
      clickLayer.drawFeature(geometry);
    };

    /**
     * Draws an arrow at specified location to indicate click.
     * Used to indicate location of rain graph
     *
     * @param {object} mapState - the mapState object, which assumes the key
     *   'here' to have a unundefined value.
     */
    drawArrow = function (mapState, latLng) {
      var geometry = {
        "type": "Point",
        "coordinates": [latLng.lng, latLng.lat]
      };
      clickLayer.drawFeature(geometry);
      clickLayer.addLocationMarker(mapState, latLng);
    };

    drawLine = function (mapState, first, second, dashed) {
      clickLayer.drawLineElement(first, second, dashed);
    };

    startVibration = function () {
      clickLayer.vibrateFeatures();
    };

    vibrateOnce = function (geojson) {
      clickLayer.vibrateOnce(geojson);
    };

    return {
      emptyClickLayer: emptyClickLayer,
      drawArrow: drawArrow,
      drawCircle: drawCircle,
      drawGeometry: drawGeometry,
      startVibration: startVibration,
      drawLine: drawLine,
      vibrateOnce: vibrateOnce
    };
  }
]);
