/**
 * Click layer
 *
 * Watches mapState.here to register a click on the map
 * Provides the tool-specific feedback by modifying the DOM. Click
 * layer feedback either is hardcoded bound to the tool or comes
 * from the utf grid.
 *
 *  TODO: What is now called MapClickController should become a service,
 *  the semi generic functions from the link function should be part of this
 *  service and the rest should form a controller.. Since there is no direct
 *  DOM modification. Probably.?
 */


/**
 * Service to draw click feedback.
 */
app.service("ClickFeedbackService", ["$rootScope",
  function ($rootScope) {
    var Ctrl = function () {

      /**
       * Remove any existing click layers and creates a new empty one.
       *
       * @param {object} map
       */
      this.emptyClickLayer = function (map) {
        if (this.clickLayer) {
          map.removeLayer(this.clickLayer);
        }
        this.clickLayer = L.geoJson().addTo(map);
        this.clickLayer.options.name = 'click';
        this.clickLayer.options.clickable = false;
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

      this.drawFeature = function (feature) {
        var geojsonFeature = { "type": "Feature" };
        geojsonFeature.geometry = feature;
        var self = this;
        this.clickLayer.options.pointToLayer = function (feature, latlng) {
          var circleMarker = L.circleMarker(latlng, {
            radius: 0,
            weight: 12,
            color: '#2980b9',
            fill: false,
            zIndexOffset: 1000,
            clickable: false
          });
          self._circleMarker = circleMarker;
          return circleMarker;
        };
        this.clickLayer.addData(geojsonFeature);
      };

      this.drawLineElement = function (first, second, dashed) {
        var geojsonFeature = { "type": "Feature" };
        geojsonFeature.geometry = {
          "type": "LineString",
          "coordinates": [[first.lng, first.lat], [second.lng, second.lat]]
        };
        this.clickLayer.options.style = {
          color: '#2980b9',
          weight: 2,
          opacity: 1,
          smoothFactor: 1
        };
        if (dashed) {
          this.clickLayer.options.style.dashArray = "5, 5";
        }
        this.clickLayer.addData(geojsonFeature);
      };

      this.vibrateFeature = function () {

        var sel = this._selection = this._getSelection(this.clickLayer);
        clearInterval(this._vibration);

        this._vibration = setInterval(function () {
          sel.select("path")
            .classed("vibrator", true)
            .attr("stroke-width", 15)
            .transition().duration(200)
            .attr("stroke-width", 20)
            .transition().duration(200)
            .attr("stroke-width", 15);
        }, 400);
      };

      this.stopVibration = function () {
        clearInterval(this._vibration);
        this._selection.select("path")
          .classed("vibrator", true)
          .attr("stroke-width", 15)
          .transition().duration(200)
          .attr("stroke-width", 20)
          .transition().duration(200)
          .attr("stroke-width", 15)
          .transition().ease("out").duration(200)
          .attr("stroke-width", 30)
          .attr("stroke-opacity", 0);
      };


      this.drawObject = function (entityName, map) {

        var selection = this._getSelection(this.clickLayer);
        this._circleMarker.setRadius(11);
        selection.select("path")
          .classed("vibrator", true)
          .attr("stroke", "#1abc9c")
          .transition().duration(150)
          .attr("stroke-width", 20)
          .transition().duration(150)
          .attr("stroke-width", 5)
          .transition().duration(150)
          .attr("stroke-width", 15)
          .transition().duration(150)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", 5);

        // Entity specific modifications
        if (entityName.indexOf("pumpstation_non_sewerage") !== -1) {
          this._circleMarker.setRadius(13);
          if (map.getZoom() < 13) {
            this._circleMarker.setRadius(16);
          }
        } else if (entityName.indexOf("pumpstation_sewerage") !== -1) {
          this._circleMarker.setRadius(11);
        } else if (entityName.indexOf("weir") !== -1) {
          this._circleMarker.setRadius(11);
        } else if (entityName.indexOf("bridge") !== -1) {
          this._circleMarker.setRadius(14);
        } else if (entityName.indexOf("pipe") !== -1 ||
                   entityName.indexOf("culvert") !== -1) {
          selection.select("path").transition().delay(450).duration(150)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", 10);
        } else if (entityName === 'manhole') {
          this._circleMarker.setRadius(7.5);
        }
      };

      this.removeLocationMarker = function () {
        d3.select(".location-marker").remove();
      };

      this.addLocationMarker = function (point) {
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
          .attr("fill", "#2980b9")
          .attr("fill-opacity", "1");
      };
    };

    var ctrl = new Ctrl(),
        drawClickInSpace,
        drawGeometry,
        drawArrowHere,
        emptyClickLayer,
        killVibrator,
        stopVibration,
        drawLine;

    /**
     * Wrapper for emptyClickLayer, as defined in the above
     * Ctrl constructor.
     *
     */
    emptyClickLayer = function (map) {
      ctrl.emptyClickLayer(map);
    };

    /**
     * Remove the vibrator from the DOM.
     */

    killVibrator = function () {
      d3.selectAll('.vibrator').remove();
    };

    /**
     * Draws visible feedback on the map after a click.
     *
     * Removes possible click feedback layer and creates a new clickLayer
     * containing a circle. The circle is than vibrated to attract attention.
     * You will need to manully call ctrl.stopVibrating or remove the layer.
     *
     * @param {object} latLng Leaflet object specifying the latitude
     * and longitude of a click
     */
    drawClickInSpace = function (map, latlng) {
      ctrl.emptyClickLayer(map);
      var geometry = {"type": "Point",
                      "coordinates": [latlng.lng, latlng.lat]};
      ctrl.drawFeature(geometry);
      ctrl.vibrateFeature();
    };

    /**
     * Draws a circle around an object on click.
     *
     * Removes possible click feedback layer and creates a new clickLayer
     * containing a circle around the clicked object. The circle is vibrated
     * to attract attention.
     *
     * @param {object} geom Geojson compliant geometry object
     * @param {string} entityName Name of the object to give it custom
     *  styling
     */
    drawGeometry = function (map, geom, entityName) {
      ctrl.emptyClickLayer(map);
      var geometry = angular.fromJson(geom);
      ctrl.drawFeature(geometry);
      ctrl.drawObject(entityName, map);
    };

    /**
     * Draws an arrow at specified location to indicate click.
     * Used to indicate location of rain graph
     *
     * @param {object} latLng Leaflet object specifying the latitude
     * and longitude of a click
     */
    drawArrowHere = function (map, latlng) {
      ctrl.emptyClickLayer(map);
      var geometry = {"type": "Point",
                      "coordinates": [latlng.lng, latlng.lat]};
      ctrl.drawFeature(geometry);
      var px = map.latLngToLayerPoint(latlng);
      ctrl.addLocationMarker(px);
    };

    stopVibration = function () {
      ctrl.stopVibration();
    };

    drawLine = function (map, first, second, dashed) {
      emptyClickLayer(map);
      ctrl.drawLineElement(first, second, dashed);
    };

    return {
      emptyClickLayer: emptyClickLayer,
      drawArrowHere: drawArrowHere,
      drawGeometry: drawGeometry,
      drawClickInSpace: drawClickInSpace,
      stopVibration: stopVibration,
      killVibrator: killVibrator,
      drawLine: drawLine,
      removeLocationMarker: ctrl.removeLocationMarker
    };
  }
]);
