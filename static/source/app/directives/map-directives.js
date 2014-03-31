'use strict';

/**
 * Map directive
 *
 * Overview
 * ========
 *
 * Defines the map. Directive does all the watching and DOM binding, MapDirCtrl holds 
 * all the testable logic. Ideally the directive has no logic and the MapDirCtrl
 * is independent of the rest of the application.
 * 
 * TODO:
 * * [ ] Move $scope out of MapDirCtrl
 * * [ ] Split up massive functions in MapDirCtrl
 * * [ ] Get rain stuff into the directive and the MapDirCtrl
 * 
 */

app.controller('MapDirCtrl', function ($scope, $timeout, $http) {

  var elevationLayer;
  // UTF bookkeeping
  var lowestUTFLayer,
      utfLayersOrder = [],
      utfHit = false;

  this.initiateLayer = function (layer) {
    if (layer.name === "Simulatie") {
      // Hack for 3Di.
      layer.follow_3di = false;
    } else if (layer.type === "TMS" && layer.baselayer) {
      layer.leafletLayer = L.tileLayer(layer.url + '.png',
                                       {name: "Background",
                                        maxZoom: 20});
    } else if (layer.type === "WMS") {
      var options = {
        layers: layer.slug,
        format: 'image/png',
        version: '1.1.1',
        minZoom: layer.min_zoom,
        maxZoom: 20
      };
      //NOTE ugly hack
      if (layer.slug === 'landuse') {
        options.styles = 'landuse';
        layer.leafletLayer = L.tileLayer.wms(layer.url, options);
      } else if (layer.slug === 'elevation') {
        // dynamically set min/max?
        // options.effects = 'shade:0:3';
        options.styles = 'BrBG_r';
        options.effects = 'shade:0:3';
        layer.leafletLayer = L.tileLayer.wms(layer.url, options);
        elevationLayer = layer.leafletLayer;
      }
    } else if (layer.type === "ASSET") {
      var url = '/api/v1/tiles/{slug}/{z}/{x}/{y}.{ext}';
      if (layer.min_zoom_click !== null) {
        var leafletLayer = new L.UtfGrid(layer.url, {
          ext: 'grid',
          slug: layer.slug,
          name: layer.slug,
          useJsonP: false,
          minZoom: layer.min_zoom_click,
          maxZoom: 20,
          order: layer.z_index,
          zIndex: layer.z_index
        });

        leafletLayer.on('click', function (e) {
          if (e.data) {
            if (e.data.geom) {
              utfHit = true;
              clickGeometry(angular.fromJson(e.data.geom), e.data.entity_name);
            } else {
              console.info("You clicked on an object from negative space");
            }
            $scope.$apply(function () {
              angular.extend($scope.activeObject, e.data);
              $scope.activeObject.latlng = e.latlng;
              $scope.activeObject.changed = !$scope.activeObject.changed;
            });
          } else {
            if (leafletLayer.options.order === lowestUTFLayer) {
              if (!utfHit || utfLayersOrder.length < 2) {
                clickInSpace(e.latlng);
                utfHit = false;
              }
            }
          }
        });
        layer.grid_layer = leafletLayer;
      }
      layer.leafletLayer = L.tileLayer(layer.url, {
        ext: 'png',
        slug: layer.slug,
        name: layer.slug,
        minZoom: layer.min_zoom,
        maxZoom: 20,
        zIndex: layer.z_index
      });
    }
    layer.initiated = true;

  };

  /**
   * Rescale elevation raster.
   *
   * Makes a request to the raster server with the current bounds
   * Gets a new scale limit and refreshes the layer.
   *
   * @param  {bounds object} bounds contains the corners of the current map view 
   */
  this.rescaleElevation = function (bounds) {
    // Make request to raster to get min and max of current bounds
    var url = 'https://raster.lizard.net/wms' + '?request=getlimits&layers=elevation' +
      '&width=16&height=16&srs=epsg:4326&bbox=' +
      bounds.toBBoxString();
    $http.get(url).success(function (data) {
      var limits = ':' + data[0][0] + ':' + data[0][1];
      var styles = 'BrBG_r' + limits;
      elevationLayer.setParams({styles: styles}, true);
      $scope.map.removeLayer(elevationLayer);
      $scope.map.addLayer(elevationLayer);
    });
  };

  /**
   * Draws visible feedback on the map after a click.
   *
   * Removes possible click feedback layer and creates a new clickLayer
   * containing a circle. The circle is than vibrated to attract attention.
   *
   * @param {object} latLng Leaflet object specifying the latitude
   * and longitude of a click
   */
  var removeProm;

  var clickInSpace = function (latLng) {
    $timeout.cancel(removeProm);
    if ($scope.mapState.clickLayer) {
      $scope.map.removeLayer($scope.mapState.clickLayer);
      delete $scope.mapState.clickLayer;
    }
    $scope.mapState.clickLayer = L.circleMarker(latLng, {
      radius: 0,
      opacity: 0.6,
      color: "#1abc9c"
    });
    $scope.mapState.clickLayer.addTo($scope.map);
    var selection = d3.select($scope.mapState.clickLayer._container);

    selection.select("path")
      .transition().duration(150)
      .attr("stroke-width", 20)
      .transition().duration(150)
      .attr("stroke-width", 5)
      .transition().duration(150)
      .attr("stroke-width", 15)
      .transition().duration(150)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 10);

    if ($scope.box.type !== 'rain') {
      removeProm = $timeout(function () {
        $scope.map.removeLayer($scope.mapState.clickLayer);
        if ($scope.box.type !== 'profile') {
          $scope.box.type = 'empty';
        }
      }, 1500);
    }
  };

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
  var clickGeometry = function (geometry, entityName) {
    $timeout.cancel(removeProm);
    if ($scope.mapState.clickLayer) {
      $scope.map.removeLayer($scope.mapState.clickLayer);
      delete $scope.mapState.clickLayer;
    }

    var circleMarker;
    var geojsonFeature = { "type": "Feature" };
    geojsonFeature.geometry = geometry;

    //Put geometry in leaflet geojson layer
    $scope.mapState.clickLayer = L.geoJson(geojsonFeature, {
      minZoom: 13,
      style: {},
      pointToLayer: function (feature, latlng) {
        circleMarker = L.circleMarker(latlng, {
          radius: 11.5,
          opacity: 0.5,
          fillOpacity: 0,
        });
        return circleMarker;
      }
    });
    $scope.mapState.clickLayer.addTo($scope.map);

    // Manually edit with d3
    // Due to some leaflet obscurity you have to get the first item with an unknown key.
    var layer = $scope.mapState.clickLayer._layers;
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
      selection.attr("transform", "translate(-6, 0)");
      circleMarker.setRadius(13);
      if ($scope.map.getZoom() < 21) {
        selection.attr("transform", "translate(0, 0)");
        circleMarker.setRadius(11);
      }
      if ($scope.map.getZoom() < 13) {
        selection.attr("transform", "translate(8, 0)");
        circleMarker.setRadius(16);
      }
      if ($scope.map.getZoom() < 11) {
        selection.attr("transform", "translate(5, 0)");
        circleMarker.setRadius(13);
      }
    } else if (entityName.indexOf("pumpstation_sewerage") !== -1) {
      selection.attr("transform", "translate(0, 3)");
      circleMarker.setRadius(11);
    } else if (entityName.indexOf("weir") !== -1) {
      selection.attr("transform", "translate(0, 4)");
      circleMarker.setRadius(11);
    } else if (entityName.indexOf("bridge") !== -1) {
      selection.attr("transform", "translate(-5, 6)");
      circleMarker.setRadius(14);
    } else if (entityName.indexOf("pipe") !== -1 || entityName.indexOf("culvert") !== -1) {
      selection.select("path").transition().delay(450).duration(150)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 10);
    } else if (entityName === 'manhole') {
      //selection.attr("transform", "translate(1, 0)");
      circleMarker.setRadius(7.5);
    }
  };

  // expects a layer hashtable with a leafletlayer object
  this.toggleLayer = function (layer, opacity) {

    if(opacity) {
      layer.leafletLayer.options.opacity = opacity;
    }

    if (!layer.active) {
      if (layer.leafletLayer) {
        $scope.map.removeLayer(layer.leafletLayer);
        if (layer.grid_layer) {
          $scope.map.removeLayer(layer.grid_layer);
          utfLayersOrder.splice(utfLayersOrder.indexOf(layer.grid_layer.options.order), 1);
          if (layer.z_index === lowestUTFLayer) {
            lowestUTFLayer = utfLayersOrder.sort()[-1];
          }
        }
      } else {
        console.log('leaflet layer not defined', layer.type, layer.name);
      }
    }
    if (layer.active) {
      if (layer.leafletLayer) {
        $scope.map.addLayer(layer.leafletLayer);
        if (layer.grid_layer) {
          if (layer.order < lowestUTFLayer || lowestUTFLayer === undefined) {
            lowestUTFLayer = layer.z_index;
          }
          utfLayersOrder.push(layer.z_index);
          // Add listener to start loading utf layers
          // after loading of visible layer to have an
          // increased user experience
          layer.leafletLayer.on('load', function () {
            // Add the grid layers of the layer when load finished
            $scope.map.addLayer(layer.grid_layer);
          });
          layer.leafletLayer.on('loading', function () {
            // Temporarily remove all utfLayers for performance
            if ($scope.map.hasLayer(layer.grid_layer)) {
              $scope.map.removeLayer(layer.grid_layer);
            }
          });
        }
      } else {
        console.log('leaflet layer not defined', layer.type);
      }
    }
  };

  // expects a layer hashtable with a leafletlayer object
  this.toggleBaseLayer = function (layer) {

    if (layer.id !== $scope.mapState.activeBaselayer) {
      layer.active = false;
      if (layer.leafletLayer) {
        $scope.map.removeLayer(layer.leafletLayer);
      } else {
        console.log('leaflet layer not defined');
      }
    } else if (layer.id === $scope.mapState.activeBaselayer) {
      layer.active = true;
      if (layer.leafletLayer) {
        $scope.map.addLayer(layer.leafletLayer, { insertAtTheBottom: true });
      } else {
        console.log('leaflet layer not defined');
      }
    }
  };

  // expects a layer hashtable with a leafletlayer object
  this.toggleOverLayer = function (layer) {

    if (layer.id !== $scope.mapState.activeOverlayer) {
      layer.active = false;
      if (layer.leafletLayer) {
        $scope.map.removeLayer(layer.leafletLayer);
      } else {
        console.log('leaflet layer not defined');
      }
    } else if (layer.id === $scope.mapState.activeOverlayer) {
      layer.active = true;
      if (layer.leafletLayer) {
        console.log(layer.leafletLayer);
        $scope.map.addLayer(layer.leafletLayer, { insertAtTheBottom: false });
      } else {
        console.log('leaflet layer not defined');
      }
    }
  };

  // Expects a leafletLayer as an argument
  this.addLayer = function (layer) {
    $scope.map.addLayer(layer);
  };

  // Expects a leafletLayer as an argument
  this.removeLayer = function (layer) {
    $scope.map.removeLayer(layer);
  };

  this.panZoomTo = function (panZoom) {
    $scope.map.setView(new L.LatLng(panZoom.lat, panZoom.lng), panZoom.zoom);
  };

  this.fitBounds = function (extent) {
    // extent is in format [[extent[0], extent[1]], [extent[2], extent[3]]]
    $scope.map.fitBounds(extent);
  };

  this.boxType = function (activeBaselayer, currentType) {
    var newType;
    if (activeBaselayer === 3) {
      newType = 'elevation';
    } else if (activeBaselayer === 4) {
      newType = 'landuse';
    } else if (currentType === 'landuse' || currentType === 'elevation') {
      newType = 'empty';
    } else {
      newType = currentType;
    }
    return newType;
  };

  return this;
});
app.directive('map', ['$location', function ($location) {

  var link = function (scope, element, attrs, ctrl) {
    // Leaflet global variable to speed up vector layer, 
    // see: http://leafletjs.com/reference.html#path-canvas
    window.L_PREFER_CANVAS = true;
    // instead of 'map' element here for testability
    var osmAttrib = 'Map data © OpenStreetMap contributors';
    var bounds = window.data_bounds.all;
    var southWest = L.latLng(bounds.south, bounds.west);
    var northEast = L.latLng(bounds.north, bounds.east);
    var maxBounds = L.latLngBounds(southWest, northEast);
    var map = new L.map(element[0], {
        zoomControl: false,
        zoom: 12
      });
    map.fitBounds(maxBounds);
    map.attributionControl.addAttribution(osmAttrib);
    map.attributionControl.setPrefix('');
    scope.map = map;

    // Initialise layers
    angular.forEach(scope.mapState.baselayers, function (layer) {
      if (!layer.initiated) {
        ctrl.initiateLayer(layer);
      }
      ctrl.toggleBaseLayer(layer);
    });

    angular.forEach(scope.mapState.overlayers, function (layer) {
      if (!layer.initiated) {
        ctrl.initiateLayer(layer);
      }
      ctrl.toggleOverLayer(layer);
    });

    angular.forEach(scope.mapState.layers, function (layer) {
      if (!layer.initiated) {
        ctrl.initiateLayer(layer);
      }
      ctrl.toggleLayer(layer);
    });

    // first time is not triggered until move.
    if (scope.mapState) {
      scope.mapState.bounds = scope.map.getBounds();
      scope.mapState.geom_wkt = "POLYGON(("
            + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getSouth() + ", "
            + scope.mapState.bounds.getEast() + " " + scope.mapState.bounds.getSouth() + ", "
            + scope.mapState.bounds.getEast() + " " + scope.mapState.bounds.getNorth() + ", "
            + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getNorth() + ", "
            + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getSouth()
            + "))";
    }

    scope.beenThereDoneIntersectSuggestion = false;

    scope.map.on('zoomend', function () {

      if (scope.map.getZoom() > 10 && scope.box.type === 'empty') {
        if (!scope.beenThereDoneIntersectSuggestion) {
          scope.beenThereDoneIntersectSuggestion = true;
          scope.box.type = 'intersecttool';
        }
      }
      // Hide and unhide clicklayer when zoomed out or in
      if (scope.mapState.clickLayer && scope.map.getZoom() < 12) {
        scope.map.removeLayer(scope.mapState.clickLayer);
      }
      if (scope.mapState.clickLayer && scope.map.getZoom() > 11) {
        scope.map.addLayer(scope.mapState.clickLayer);
      }
    });

    scope.map.on('move', function () {
      // NOTE: Check whether a $digest is already happening before using apply
      if (!scope.$$phase) {
        scope.$apply(function () {
          scope.mapState.moved = Date.now();
          scope.mapState.bounds = scope.map.getBounds();
        });
      } else {
        scope.mapState.moved = Date.now();
        scope.mapState.bounds = scope.map.getBounds();
      }
    });

    /**
     * Update the url when the map has been moved
     *
     * Set holdRightThere so the url listener is not fired when the application
     * changes the url. Precision of url is 5.
     */

    scope.map.on('moveend', function () {
      scope.holdRightThere = true;
      var COORD_PRECISION = 5;
      var newHash = [
        scope.map.getCenter().lat.toFixed(COORD_PRECISION),
        scope.map.getCenter().lng.toFixed(COORD_PRECISION),
        scope.map.getZoom()
      ].join(',');
      if (!scope.$$phase) {
        scope.$apply(function () {
          $location.hash(newHash);
        });
      } else {
        $location.hash(newHash);
      }
      // If elevation layer is active:
      if (scope.mapState.activeBaselayer === 3 && scope.tools.active === 'autorescale') {
        ctrl.rescaleElevation(scope.mapState.bounds);
      }
    });

    scope.map.on('dragend', function () {
      if (scope.box.type === 'default') {
      // scope.box.type = 'empty';
        scope.$apply(function () {
          scope.box.close();
        });
      }
      if (scope.box.type === 'intersecttool') {
        scope.$apply(function () {
          scope.box.type = 'empty';
        });
      }
    });

    /**
     * Listener to update map view when user changes url
     *
     * HoldRightThere is set to true when the application updates
     * the url. Then, this listener is fired but does nothing but
     * resetting the holdRightThere back to false
     */
    scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {
      if (!scope.holdRightThere || scope.holdRightThere === undefined) {
        var latlonzoom = $location.hash().split(',');
        if (latlonzoom.length >= 3) { // must have 3 parameters or don't setView here...
          if (parseFloat(latlonzoom[0]) && parseFloat(latlonzoom[1]) && parseFloat(latlonzoom[2])) {
            scope.map.setView([latlonzoom[0], latlonzoom[1]], latlonzoom[2], {reset: true, animate: true});
          }
        }
      }
      scope.holdRightThere = false;
    });

    /**
     * Watch to remove clicklayer when user clicks on omnibox close button.
     */
    scope.$watch('box.type', function (n, o) {
      if (n === o) { return true; }
      if (scope.mapState.clickLayer && scope.box.type === 'empty') {
        ctrl.removeLayer(scope.mapState.clickLayer);
        delete scope.mapState.clickLayer;
      }
    });

    scope.mapState.changeLayer = function (layer, opacity) {
      ctrl.toggleLayer(layer, opacity);
    };

    /**
     * Rescale elevation map when pressing on or off
     */
    scope.$watch('tools.active', function (n, o) {
      if (n === o) { return true; }
      if (scope.tools.active === 'autorescale') {
        ctrl.rescaleElevation(scope.mapState.bounds);
      }
    });

    /**
     * Changes the baselayer
     *
     * There is only one active baselayer. If baselayer is given, this layer
     * becomes the activebaselayer and all baselayers are send to the
     * toggleBaselayer function to turn them on or off. If you set the
     * activeBaselayer manually this function may also be called to update all 
     * baselayers. 
     * 
     * @param {layer object} baselayer: the baselayer to activate
     */
    scope.mapState.changeBaselayer = function (baselayer) {
      if (baselayer) { scope.mapState.activeBaselayer = baselayer.id; }
      angular.forEach(scope.mapState.baselayers, function (baselayer) {
        ctrl.toggleBaseLayer(baselayer);
      });
      scope.mapState.baselayerChanged = Date.now();
      scope.box.type = ctrl.boxType(scope.mapState.activeBaselayer, scope.box.type);
    };

    /**
     * Changes the overlayer
     * @param  {[type]} overlayer [description]
     * @return {[type]}           [description]
     */
    scope.mapState.changeOverlayer = function(overlayer) {
      ctrl.toggleOverLayer(overlayer);
      scope.mapState.overlayerChanged = Date.now();
    }
    scope.zoomToTheMagic = function (layer) {
      ctrl.zoomToTheMagic(layer);
    };

  };

  return {
      restrict: 'E',
      replace: true,
      template: '<div id="map"></div>',
      controller: 'MapDirCtrl',
      link: link
    };
}]);

app.directive('rain', function () {
  return {
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {
      var imageBounds = [[54.28458617998074, 1.324296158471368], [49.82567047026146, 8.992548357936204]];
      var imageOverlay =  L.imageOverlay('', imageBounds, {opacity: 0.8});
      scope.$watch('rain.enabled', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if (newVal) {
            mapCtrl.addLayer(imageOverlay);
          } else {
            mapCtrl.removeLayer(imageOverlay);
          }
        }
      });

      scope.$watch('rain.currentFrame', function (newVal, oldVal) {
        if (newVal === oldVal) { return; }
        if (imageOverlay !== undefined) {
          var imgFromStorage = localStorage.getItem(scope.rain.currentFrame);
          imageOverlay.setUrl(imgFromStorage);
          imageOverlay.setOpacity(0.8);
          if (scope.rain.currentFrame === null) {
            imageOverlay.setOpacity(0);
          }
        }
      });
    }
  };
});
