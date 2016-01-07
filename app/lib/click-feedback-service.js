
/**
 * Service to draw click feedback.
 */
angular.module('lizard-nxt')
  .service('ClickFeedbackService', ['$rootScope', 'LeafletService',
  function ($rootScope, LeafletService) {
    var ClickLayer = function () {

      /**
       * @description Removes clicklayer, adds a new one.
       *              Clicklayer has a default color, opacity
       *              and a way to transform points.
       * @param {object} mapState
       */
      this.emptyClickLayer = function (mapState) {
        clearInterval(this._vibration);

        if (this.clickLayer) {
          mapState.removeLeafletLayer(this.clickLayer);
        }

        this.clickedPoints = [];

        this.clickLayer = LeafletService.geoJson(null, {
          style: function (feature) {
            return {
              name: 'click',
              clickable: true,
              color: '#c0392b',
              stroke: '#c0392b',
              opacity: 0.8,
              'stroke-opacity': 0.8,
              radius: getRadius(feature),
            };
          }
        });

        var self = this;
        // Explain leaflet to draw points as circlemarkers.
        this.clickLayer.options.pointToLayer = function (feature, latlng) {
          var circleMarker = L.circleMarker(latlng, {
            radius: 0,
            weight: self.strokeWidth,
            fill: false,
            zIndexOffset: 1000,
            clickable: true
          });
          self._circleMarker = circleMarker;
          return circleMarker;
        };

        // Hack to make click on the clicklayer bubble down to the map it is
        // part of.
        this.clickLayer.on('click', function (e) {
            this._map.fire('click', e);
          }
        );

        mapState.addLeafletLayer(this.clickLayer);
      };

      /**
       * Returns the svg as a d3 selection of leaflet layer.
       *
       * @param  {object} layer
       * @return {object} the svg of the leaflet object layer
       */
      this._getSelection = function (layer, _id) {
        // Due to some leaflet obscurity you have to get the first item with an
        // unknown key.
        var _layers = layer._layers;
        var selection;
        if (_id) {
          selection = d3.select(_layers[_id]._container);
        } else {
          for (var key in _layers) {
            selection = d3.select(_layers[key]._container);
            // Don't break, because we need the latest item;
          }
        }
        return selection;
      };

      /**
       * @description add data to the clicklayer
       * with a small hackery to find out this specific id
       */
      this.drawFeature = function (geojson) {
        this.strokeWidth = 5;
        var oldIds = Object.keys(this.clickLayer._layers);

        // actually add the data
        this.clickLayer.addData(geojson);
        
        // check id.
        var newIds = Object.keys(this.clickLayer._layers);
        var newId;
        angular.forEach(newIds, function (item) {
          if (oldIds.indexOf(item) < 0) {
            newId = item;
          }
        });
        return newId;
      };

      /**
       * @function drawLineElement
       * @memberof clickFeedbackService
       * @summary Draws a line between the given points.
       * @description Draws a line between `first` and `second`. If `first` or
       * `second` don't exist, return. If `dashed` is `true`, draw a dashed
       * line.
       *
       * @param  {L.LatLng} first - start of the line
       * @param  {L.LatLng} second - end of the line
       * @param  {boolean} dashed - when true draws a dashed line
       */
      this.drawLineElement = function (first, second, dashed) {

        if (first === undefined || second === undefined) {
          return;
        }

        this.strokeWidth = 2;

        var geojsonFeature = { "type": "Feature" };
        geojsonFeature.geometry = {
          "type": "LineString",
          "coordinates": [[first.lng, first.lat], [second.lng, second.lat]]
        };
        this.clickLayer.options.style = {
          color: '#c0392b',
          weight: this.strokeWidth,
          opacity: 1,
          smoothFactor: 1
        };
        if (dashed) {
          this.clickLayer.options.style.dashArray = "5, 5";
        }
        this.clickLayer.addData(geojsonFeature);
      };

      /**
       * @description vibrates the features in the clickLayer.
       */
      this.vibrateFeatures = function (id) {
        var sel = this._selection = this._getSelection(this.clickLayer, id);
        clearInterval(this._vibration);
        var vibrate = this.vibrate;
        var self = this;
        this._vibration = setInterval(
          function () { vibrate.call(self, sel, false); }, 400);
      };

      /**
       * @describtion Vibrate the features in the clicklayer once.
       *
       * @param  {geojson} geojson if provided draws the features in
       *                           the geojson, vibrates it and removes it.
       */
      this.vibrateOnce = function (geojson, layerId) {
        var sel = this._selection = this._getSelection(this.clickLayer, layerId);
        var remove = false;
        if (geojson) {
          sel = this._getSelection(this.clickLayer, this.drawFeature(geojson));
          //sel = this._selection = this._getSelection(this.clickLayer);
          remove = true;
        }
        this.vibrate(sel, remove);
      };

      /**
       * @description add a locationMarker as a leaflet marker with
       *              a leaflet divIcon. Overwrites the pointTolayer
       *              of the clicklayer.
       * @param {object} mapState nxt mapState
       * @param {L.latLng} latLng location of marker
       */
      this.addLocationMarker = function (mapState, latLng) {
        var divIcon = L.divIcon({
          className: 'selected',
          iconAnchor: [10, 48],
          html: '<svg width=20 height=48><path d="M10,16'
            + 'c-5.523 0-10 4.477-10 10 0 10 10 22 10 22'
            + 's10-12 10-22c0-5.523-4.477-10-10-10z M10,32'
            + ' c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686'
            + ' 6 6-2.686 6-6 6z"></path></svg>'
        });

        this.clickLayer.options.pointToLayer = function (feature, latlng) {
          return L.marker(latlng, {
            icon: divIcon,
            clickable: true
          });
        };

      };

      /**
       * @descriptions vibretes a selection.paths by varying the stroke-width
       * @param  {object} sel selection contaning a path.
       * @param  {boolean} remove to remove or not. When true, stroke-widh
       *                          is set to 0 at the end the vibration.
       */
      this.vibrate = function (sel, remove) {
        if (sel.empty()) { return; } // bail when empty
        var width = this.strokeWidth;

        sel.selectAll("path")
          .classed("vibrator", true)
          .attr("stroke-width", function () { return width * 2; })
          .transition().duration(200)
          .attr("stroke-width", function () { return width * 3; })
          .transition().duration(200)
          .attr("stroke-width", function () { return remove ? 0 : width; });
      };

      /**
       * @description returns specific radius for water-objects coming from
       *              the utfGrid
       * @param  {object} geojson feature containing the entity_name of the
       *                           water-object
       * @return {int}             radius
       */
      var getRadius = function (feature) {
        var entityName = feature.properties.entity_name,
            entityType = feature.properties.type;
        var radius = feature.properties.radius || 0;
        if (entityName) {
          radius = 12;
          if (entityName === "pumpstation" && entityType !== "Rioolgemaal") {
            radius =  13;
          } else if (entityType === "Rioolgemaal" || entityName === "weir") {
            radius =  11;
          } else if (entityName === "bridge" || entityName === "manhole") {
            radius =  14;
          }
        }
        return radius;
      };

    };

    var clickLayer = new ClickLayer(),
        emptyClickLayer,
        removeClickFromClickLayer,
        drawCircle,
        drawArrow,
        drawLine,
        drawGeometry,
        startVibration,
        vibrateOnce;

    /**
     * @description should remove that exact click that is wanting to be
     * removed from the map
     * @params {object} LatLng object
     */
    removeClickFromClickLayer = function (toBeRemovedClick) {
      if (toBeRemovedClick in clickLayer.clickLayer._layers) {
        clickLayer.clickLayer.removeLayer(toBeRemovedClick);
      }
    };


    /**
     * @description empties the clicklayer.
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
    drawCircle = function (mapState, latlng, dontEmpty) {
      if (!dontEmpty) {
        clickLayer.emptyClickLayer(mapState);
      }
      var geometry = {
        "type": "Point",
        "coordinates":
          [latlng.lng, latlng.lat]
      };
      return clickLayer.drawFeature(geometry);
    };

    drawGeometry = function (mapState, geometry, entityName) {
      clickLayer.drawFeature(geometry);
    };

    /**
     * @function drawArrow
     * @memberof ClickFeedbackService
     * @summary Draws an arrow at latLng.
     * @description Draws arrow at specified location to indicate click. Used
     * to indicate location of rain graph. Returns void if latLng doesn't exist.
     *
     * @param {object} mapState - the mapState object, which assumes the key
     *   'here' to be defined.
     */
    drawArrow = function (mapState, latLng) {

      if (latLng === undefined) {
        return;
      }

      clickLayer.emptyClickLayer(mapState);
      var geometry = {
        "type": "Point",
        "coordinates": [latLng.lng, latLng.lat]
      };
      clickLayer.addLocationMarker(mapState, latLng);
      clickLayer.drawFeature(geometry);
    };

    drawLine = function (first, second, dashed) {
      clickLayer.drawLineElement(first, second, dashed);
    };

    startVibration = function (id) {
      clickLayer.vibrateFeatures(id);
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
      removeClickFromClickLayer: removeClickFromClickLayer,
      vibrateOnce: vibrateOnce
    };
  }
]);
