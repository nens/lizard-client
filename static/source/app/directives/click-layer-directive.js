/**
 * Click layer
 * 
 * Watches mapState.here to register a click on the map
 * Provides the tool-specific feedback by modifying the DOM
 * Watches activeObject to override this feedback with 
 * 
 * Requires map, scope.mapState.here and a notion of the utf-grids
 * 
 */


app.directive('clickLayer', ["$q", function ($q) {

  var MapClickController = function () {
    
    this.emptyClickLayer = function (map) {
      if (this.clickLayer) {
        map.removeLayer(this.clickLayer);
      }
      this.clickLayer = L.geoJson().addTo(map);
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
      // Due to some leaflet obscurity you have to get the first item with an unknown key.
      var layer = this.clickLayer._layers;
      var selection;
      for (var key in layer) {
        selection = d3.select(layer[key]._container);
        break;
      }

      this._selection = selection;

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
      // Due to some leaflet obscurity you have to get the first item with an unknown key.
      var layer = this.clickLayer._layers;
      var selection;
      for (var key in layer) {
        selection = d3.select(layer[key]._container);
        break;
      }

      selection.select("path")
        .attr("stroke", "#1abc9c")
        .transition().duration(150)
        .attr("stroke-width", 20)
        .transition().duration(150)
        .attr("stroke-width", 5)
        .transition().duration(150)
        .attr("stroke-width", 15)
        .transition().duration(150)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 5);

      // Entity specific modifications
      if (entityName.indexOf("pumpstation_non_sewerage") !== -1) {
        this._circleMarker.setRadius(13);
        if (map.getZoom() < 21) {
          this._circleMarker.setRadius(13);
        }
        if (map.getZoom() < 13) {
          this._circleMarker.setRadius(16);
        }
        if (map.getZoom() < 11) {
          this._circleMarker.setRadius(13);
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
        drawClickInSpace(scope.mapState.here);
        if (scope.deferred) {
          // cancel by resolving
          scope.deferred.resolve();
        }
        var promise = getDataFromUTF(scope.mapState.here);
        promise.then(function (response) {
          ctrl.stopVibration();
          if (response) {
            if (response.data) {
              drawGeometry(response.data);
            }
          }
        });
        break;
      }
    });

    /**
     * Draws visible feedback on the map after a click.
     *
     * Removes possible click feedback layer and creates a new clickLayer
     * containing a circle. The circle is than vibrated to attract attention.
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
     * containing a circle. The circle is vibrated to attract attention.
     *
     * @param {object} geometry Geojson compliant geometry object coming
     *  from UTFgrid
     * @param {string} entityName Name of the object to give it custom
     *  styling
     */
    var drawGeometry = function (data) {
      ctrl.emptyClickLayer(scope.map);
      var geometry = angular.fromJson(data.geom);
      ctrl.drawFeature(geometry);
      ctrl.drawObject(data.entity_name, scope.map);
    };

    function drawArrowHere(latlng) {
      
    }

    function drawFromHereToHere(latlng) {

    }

    function getDataFromUTF(latlng) {
      scope.deferred = $q.defer();
      var sewerageLayer = getLayer('grid', 'sewerage');
      var e = {};
      e.latlng = latlng;
      if (sewerageLayer) {
        var response = sewerageLayer._objectForEvent(e);
        if (response.data === null && sewerageLayer.isLoading) {
          getDataFromUTFAsynchronous(sewerageLayer, e);
        } else {
          scope.deferred.resolve(response);
          angular.extend(scope.activeObject, response.data);
          scope.activeObject.latlng = response.latlng;
          scope.activeObject.changed = !scope.activeObject.changed;
        }
      } else {
        getDataFromUTFAsynchronous(sewerageLayer, e);
      }
      return scope.deferred.promise;
    }

    function getDataFromUTFAsynchronous(sewerageLayer, e) {
      // If there is no grid layer it is probably still being
      // loaded by the map-directive which will broadcast a 
      // message when its loaded. 
      if (scope.on) {
        // cancel it
        scope.on();
      }
      scope.on = scope.$on('sewerageGridLoaded', function () {
        scope.on();
        // since this part executes async in a future turn of the event loop, we need to wrap
        // it into an $apply call so that the model changes are properly observed.
        scope.$apply(function () {
          sewerageLayer = getLayer('grid', 'sewerage');
          var response = sewerageLayer._objectForEvent(e)
          scope.deferred.resolve(response);
          angular.extend(scope.activeObject, response.data);
          scope.activeObject.latlng = response.latlng;
          scope.activeObject.changed = !scope.activeObject.changed;
        });
      });
    }

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

    // leafletLayer.on('click', function (e) {
    //   if (e.data) {
    //     $scope.$apply(function () {
    //       angular.extend($scope.activeObject, e.data);
    //       $scope.activeObject.latlng = e.latlng;
    //       $scope.activeObject.changed = !$scope.activeObject.changed;
    //     });
    //   }
    // });

    };

  return {
    scope: true, // isolate scope
    //require: 'map',
    link: link,
    controller: MapClickController
  };
}]);
