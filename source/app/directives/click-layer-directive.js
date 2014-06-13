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


app.directive('clickLayer', ["$q", function ($q) {

  var MapClickController = function () {
    
    /**
     * Remove any existing click layers and creates a new empty one
     * @param  {leaflet map object} map
     */
    this.emptyClickLayer = function (map) {
      if (this.clickLayer) {
        map.removeLayer(this.clickLayer);
      }
      this.clickLayer = L.geoJson().addTo(map);
    };

    /**
     * Returns the svg as a d3 selection of leaflet layer
     * @param  {leaflet svg layer} layer
     * @return {d3 selection} the svg of the leaflet object layer
     */
    this._getSelection = function (layer) {
      // Due to some leaflet obscurity you have to get the first item with an unknown key.
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
          color: '#1abc9c',
          fill: false
        });
        self._circleMarker = circleMarker;
        return circleMarker;
      };
      this.clickLayer.addData(geojsonFeature);
    };

    this.vibrateFeature = function () {
      this._selection = this._getSelection(this.clickLayer);

      var self = this;

      clearInterval(this._vibration);
      this._vibration = setInterval(function () {
        self._selection.select("path")
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
      } else if (entityName.indexOf("pipe") !== -1 || entityName.indexOf("culvert") !== -1) {
        selection.select("path").transition().delay(450).duration(150)
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 10);
      } else if (entityName === 'manhole') {
        this._circleMarker.setRadius(7.5);
      }
    };

    this.substitueFeatureForArrow = function (point) {
      var selection = this._getSelection(this.clickLayer);
      var g = selection;
      // This is an arrow:
      var path = "M " + point.x + " " + point.y + " " +
                 "l 15 -10 " +
                 "l -10 0 " +
                 "l 0 -15 " +
                 "l -10 0 " +
                 "l 0 15 " +
                 "l -10 0 z";
      g.select("path").attr("d", path)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 2)
        .attr("stroke", "white")
        .attr("fill", "#2980b9")
        .attr("fill-opacity", "1");
    };

  };

  var link = function (scope, element, attrs, ctrl) {
    /**
     * Watches mapState.here to draw the appropriate feedback
     *
     * Feedback depends on active tool or response of the utfgrid. 
     * Call to utf grid is asynchronous, users always see a registration
     * of its click. If the utf grid responts, this is updated with a 
     * hightlight around the geometry.
     */
    scope.$watch('mapState.here', function (n, o) {
      if (n === o) { return true; }
      switch (scope.tools.active) {
      case 'rain':
        drawArrowHere(scope.mapState.here);
        break;
      case 'profile':
        drawFromHereToHere(scope.mapState.here);
        break;
      default:
        // Give feedback of the click
        drawClickInSpace(scope.mapState.here);
        if (scope.deferred) {
          // cancel by resolving
          scope.deferred.resolve();
        }
        // Get data asynchronous
        var promise = getDataFromUTF(scope.mapState.here);
        promise.then(function (response) {
          // Either way, stop vibrating
          ctrl.stopVibration();
          if (response) {
            if (response.data) {
              drawGeometry(response.data.geom, response.data.entity_name);
            }
          }
        });
        break;
      }
    });

    /**
     * Remove click feedback when switching between tools.
     */
    scope.$watch('tools.active', function (n, o) {
      if (n !== o) { ctrl.emptyClickLayer(scope.map); }
    });

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
    function drawClickInSpace(latlng) {
      ctrl.emptyClickLayer(scope.map);
      var geometry = {"type": "Point",
                      "coordinates": [latlng.lng, latlng.lat]};
      ctrl.drawFeature(geometry);
      ctrl.vibrateFeature();
    }

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
    var drawGeometry = function (geom, entityName) {
      ctrl.emptyClickLayer(scope.map);
      var geometry = angular.fromJson(geom);
      ctrl.drawFeature(geometry);
      ctrl.drawObject(entityName, scope.map);
    };

    /**
     * Draws an arrow at specified location to indicate click.
     * Used to indicate location of rain graph
     * 
     * @param {object} latLng Leaflet object specifying the latitude
     * and longitude of a click
     */
    function drawArrowHere(latlng) {
      ctrl.emptyClickLayer(scope.map);
      var geometry = {"type": "Point",
                "coordinates": [latlng.lng, latlng.lat]};
      ctrl.drawFeature(geometry);
      var px = scope.map.latLngToLayerPoint(latlng);
      ctrl.substitueFeatureForArrow(px);
    }

    /**
     * TODO
     * 
     * Draws an arrow directing to the users mouse which stops following
     * the mouse at the second click to show location of line for profile
     * tool.
     * 
     * @param  {[type]} [description]
     * @return {[type]} [description]
     */
    function drawFromHereToHere() {
    }

    /**
     * Gets data from utf grid.
     *  
     * @param  {object} latlng leaflet object specifying the location
     *                         of a click
     * @return {promise} scope.defferred.promise Containing a thennable 
     *                         promise of an utf data object which is either
     *                         immediately resolved or resolved when the 
     *                         the grid layer has finished loading
     */
    function getDataFromUTF(latlng) {
      scope.deferred = $q.defer();
      // Get waterchainLayer or false
      var waterchainLayer = getLayer('grid', 'waterchain');
      // event object for utfgrid plugin
      var e = {};
      e.latlng = latlng;
      if (waterchainLayer) {
        // Make call to private function from utfgrid plugin
        var response = waterchainLayer._objectForEvent(e);
        // If empty and still loading it might be empty because
        // the grid was there but did not contain the tile containing
        // this the latlng. 
        if (response.data === null && waterchainLayer.isLoading) {
          getDataFromUTFAsynchronous(e);
        } else {
          // Resolve with response and update activeObject
          scope.deferred.resolve(response);
          extendDataToActiveObject(response);
        }
      } else {
        getDataFromUTFAsynchronous(e);
      }
      return scope.deferred.promise;
    }

    /**
     * Adds listener to the broadcast from map-directive messaging
     * that the utf grid has finished loading.
     * 
     * @param  {leaflet event object} e containing e.latlng for the 
     *                                  location of the click
     */
    function getDataFromUTFAsynchronous(e) {
      // If there is no grid layer it is probably still being
      // loaded by the map-directive which will broadcast a 
      // message when its loaded. 
      if (scope.on) {
        // cancel it
        scope.on();
      }
      scope.on = scope.$on('waterchainGridLoaded', function () {
        scope.on();
        var waterchainLayer = getLayer('grid', 'waterchain');
        var response = waterchainLayer._objectForEvent(e);
        // since this part executes async in a future turn of the event loop, we need to wrap
        // it into an $apply call so that the model changes are properly observed.
        scope.$apply(function () {
          scope.deferred.resolve(response);
          extendDataToActiveObject(response);
        });
      });
    }

    var extendDataToActiveObject = function (response) {
      scope.activeObject.attrs = {};
      angular.extend(scope.activeObject.attrs, response.data);
      if (response.data) {
        var geom = JSON.parse(response.data.geom);
        scope.activeObject.latlng = {lat: geom.coordinates[0], lng: geom.coordinates[1]};
      }
      scope.activeObject.changed = !scope.activeObject.changed;
    };

    /**
     * Get layer from leaflet map object.
     *
     * Because leaflet doesn't supply a map method to get a layer by name or
     * id, we need this crufty function to get a layer.
     *
     * NOTE: candidate for (leaflet) util module
     *
     * @layerType: layerType, type of layer to look for either `grid`, `png`
     * or `geojson`
     * @param: entityName, name of ento
     * @returns: leaflet layer object or false if layer not found
     */
    var getLayer = function (layerType, entityName) {
      var layer = false,
          tmpLayer = {};
      for (var i in scope.map._layers) {
        tmpLayer = scope.map._layers[i];
        if (tmpLayer.options.name === entityName &&
            tmpLayer.options.ext === layerType) {
          layer = tmpLayer;
          break;
        }
      }
      return layer;
    };

  };

  return {
    scope: true, // isolate scope
    link: link,
    controller: MapClickController
  };
}]);
