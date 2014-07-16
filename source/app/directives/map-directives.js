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

app.controller('MapDirCtrl', function ($scope, $rootScope, $http, $filter) {

  var elevationLayer;
  // UTF bookkeeping
  var lowestUTFLayer,
      utfLayersOrder = [],
      utfHit = false;

  this.initiateLayer = function (layer) {
    if (layer.type === "TMS" && layer.baselayer) {
      layer.leafletLayer = L.tileLayer(layer.url + '.png',
                                       {name: "Background",
                                        maxZoom: 19,
                                        detectRetina: true,
                                        zIndex: layer.z_index});
    } else if (layer.type === "WMS") {
      var options = {
        layers: layer.slug,
        format: 'image/png',
        version: '1.1.1',
        minZoom: layer.min_zoom,
        maxZoom: 19,
        zIndex: layer.z_index
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
      } else if (layer.slug === 'demo/radar') {
        options.styles = 'transparent';
        options.transparent = true;
        layer.leafletLayer = L.tileLayer.wms(layer.url, options);
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
          maxZoom: 19,
          order: layer.z_index,
          zIndex: layer.z_index
        });
        layer.grid_layer = leafletLayer;
      }
      layer.leafletLayer = L.tileLayer(layer.url, {
        ext: 'png',
        slug: layer.slug,
        name: layer.slug,
        minZoom: layer.min_zoom,
        maxZoom: 19,
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

  // expects a layer hashtable with a leafletlayer object
  this.toggleLayer = function (layer) {

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
        // fck log messages.
        // console.log('leaflet layer not defined', layer.type, layer.name);
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
            layer.grid_layer.on('load', function () {

              // TODO: Must be implemented via ng watch, e.g.
              // $scope.mapState.gridLoaded. Also, refactor click layer directive.

              //// Broadcast a load finished message to a.o. aggregate-directive

              $rootScope.$broadcast(layer.slug + 'GridLoaded');
            });
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

    try {
      angular.forEach($scope.mapState.overlayers, function (layer) {
          layer.leafletLayer.bringToFront();
        });
    } catch (err ) {
      // known error
      if (err instanceof TypeError) {
        return;
      } else {
        console.error('Error:', err);
      }
    }
  };

  /**
   * Update overlayer opacities.
   */
  this.updateOverLayers = function (mapState) {
    var numLayers = 1;
    angular.forEach(mapState.layers, function (layer) {
      if ((layer.overlayer === true) && (layer.active)) {
        numLayers += 1;
      }
    });
    angular.forEach($filter('orderBy')(mapState.layers, 'z_index', true), function (layer) {
      if ((layer.overlayer === true) && (layer.active)) {
        layer.leafletLayer.setOpacity(1 / numLayers);
        numLayers -= 1;
      }
    });
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

  /**
   * Set box type based on active layer.
   *
   * TODO: refactor
   *
   * @param {layer object} activeBaselayer
   * @param {string} currentType current box type
   * @return {string} newType new box type
   *
   */
  this.boxType = function (mapState) {
    var newState = ($scope.box.type === 'profile') ? 'profile' : 'raster-aggregate';
    if (mapState.activeBaselayer === 3) {
      newState = 'elevation';
    } else {
      angular.forEach(mapState.layers, function (layer) {
        if ((layer.slug === 'landuse') && (layer.active)) {
          newState = 'landuse';
        }
      });
    }
    return newState;
  };

  return this;
});
app.directive('map', ['$controller', 'UtilService', function ($controller, UtilService) {

  var link = function (scope, element, attrs, ctrl) {
    // Leaflet global variable to peed up vector layer,
    // see: http://leafletjs.com/reference.html#path-canvas
    window.L_PREFER_CANVAS = true;
    // instead of 'map' element here for testability
    var osmAttrib = '<a href="https://www.mapbox.com/about/maps/">&copy; Mapbox</a> <a href="http://www.openstreetmap.org/">&copy; OpenStreetMap</a>';
    var bounds = window.data_bounds.all;
    var southWest = L.latLng(bounds.south, bounds.west);
    var northEast = L.latLng(bounds.north, bounds.east);
    var maxBounds = L.latLngBounds(southWest, northEast);
    var map = new L.map(element[0], {
        zoomControl: false,
        zoom: 12
      });

    /***
      * Fade out (in) currently (in-)visible cards.
      *
      * @param {boolean} fadeIn - A boolean denoting whether we need to
      * fade in or out.
      */
    var fadeCurrentCards = function (fadeIn) {
      d3.selectAll(".card")
        .transition(100)
        .style("opacity", (fadeIn ? 1 : 0.2));
    };

    map.fitBounds(maxBounds);
    map.attributionControl.addAttribution(osmAttrib);
    map.attributionControl.setPrefix('');
    UtilService.getZoomlevelLabel(map.getZoom());
    scope.map = map;
    scope.mapState.bounds = scope.map.getBounds();

    // Initialise layers
    angular.forEach(scope.mapState.baselayers, function (layer) {
      if (!layer.initiated) {
        ctrl.initiateLayer(layer);
      }
      ctrl.toggleBaseLayer(layer);
    });

    angular.forEach(scope.mapState.layers, function (layer) {
      if (!layer.initiated) {
        ctrl.initiateLayer(layer);
      }
      ctrl.toggleLayer(layer);
    });

    scope.map.on('click', function (e) {
      // NOTE: Check whether a $digest is already happening before using apply
      if (!scope.$$phase) {
        scope.$apply(function () {
          scope.mapState.here = e.latlng;
        });
      } else {
        scope.mapState.here = e.latlng;
      }
    });

    scope.map.on('movestart', function () {

      fadeCurrentCards(false);

      if (!scope.$$phase) {
        scope.$apply(function () {
          scope.mapState.mapMoving = true;
        });
      } else {
        scope.mapState.mapMoving = true;
      }
    });

    scope.map.on('moveend', function () {
      fadeCurrentCards(true);
      // NOTE: Check whether a $digest is already happening before using apply
      if (!scope.$$phase) {
        scope.$apply(function () {
          scope.mapState.moved = Date.now();
          scope.mapState.mapMoving = false;
          scope.mapState.bounds = scope.map.getBounds();
        });
      } else {
        scope.mapState.moved = Date.now();
        scope.mapState.mapMoving = false;
        scope.mapState.bounds = scope.map.getBounds();
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
     * Watch to remove clicklayer when user clicks on omnibox close button.
     */
    scope.$watch('box.type', function (n, o) {
      if (n === o) { return true; }
      if (scope.mapState.clickLayer && scope.box.type === 'empty') {
        ctrl.removeLayer(scope.mapState.clickLayer);
        delete scope.mapState.clickLayer;
      }
    });

    scope.mapState.changeLayer = function (layer) {
      if (layer.overlayer === true) {
        ctrl.updateOverLayers(scope.mapState);
      }
      ctrl.toggleLayer(layer);
      scope.box.type = ctrl.boxType(scope.mapState);
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
     * Changes the baselayer.
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
      scope.box.type = ctrl.boxType(scope.mapState);
    };

    scope.$watch('mapState.panZoom', function (n, o) {
      if (n === o) { return true; }
      if (scope.mapState.panZoom.isValid()) {
        ctrl.fitBounds(scope.mapState.panZoom);
      } else {
        ctrl.panZoomTo(scope.mapState.panZoom);
      }
    });

    // Instantiate the controller that updates the hash url after creating the map
    // and all its listeners.
    $controller('hashGetterSetter', {$scope: scope});

  };

  return {
      restrict: 'E',
      replace: true,
      template: '<div id="map"></div>',
      controller: 'MapDirCtrl',
      link: link
    };
}]);

/**
 * Show rain WMS images as overlay, animate overlays when animation is
 * playing.
 */
app.directive('rain', ["RasterService", "UtilService",
  function (RasterService, UtilService) {
  return {
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      // TODO: get imageBounds from map extent or set in RasterService
      var imageBounds = [[54.28458617998074, 1.324296158471368],
                         [49.82567047026146, 8.992548357936204]];
      var utcFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
      var step = RasterService.rainInfo.timeResolution;
      var imageUrlBase = RasterService.rainInfo.imageUrlBase;
      var imageOverlays = {};
      var frameLookup = {};
      var numCachedFrames = 30;
      var previousFrame = 0;
      var previousDate;
      var nxtDate;
      var loadingRaster = 0;
      var restart = false;

      /**
       * Set up imageOverlays.
       */

      for (var i = 0; i < numCachedFrames; i++) {
        var imageOverlay = L.imageOverlay('', imageBounds, {opacity: 0});
        imageOverlays[i] = imageOverlay;
      }

      var addLoadListener = function (image, i, date) {
        image.on("load", function (e) {
          loadingRaster -= 1;
          frameLookup[date] = i;
          if (restart && loadingRaster === 0) {
            restart = false;
            scope.timeState.playPauseAnimation();
          }
        });
      };

      /**
       * Get next x images from timestamp;
       *
       * @param: {integer} timestamp - javascript timestamp in ms
       *
       * TODO: check if this should go to the RasterService?
       */
      var getImages = function (timestamp) {
        nxtDate = UtilService.roundTimestamp(scope.timeState.at,
                                                 step, false);
        previousDate = nxtDate;
        loadingRaster = 0;
        // All frames are going to load new ones, empty lookup
        frameLookup = {};
        for (var i in imageOverlays) {
          loadingRaster += 1;
          imageOverlays[i].setOpacity(0);
          // Remove old listener
          imageOverlays[i].off('load');
          addLoadListener(imageOverlays[i], i, nxtDate);
          imageOverlays[i].setUrl(imageUrlBase +
                        utcFormatter(new Date(nxtDate)));
          nxtDate += step;
        }
      };

      /**
       * When rain is enabled, add imageOverlay layer, remove layer when rain
       * is disabled.
       */
      scope.$watch('rain.enabled', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          var i;
          if (newVal) {
            for (i in imageOverlays) {
              mapCtrl.addLayer(imageOverlays[i]);
            }
            getImages(scope.timeState.at);
          } else {
            for (i in imageOverlays) {
              mapCtrl.removeLayer(imageOverlays[i]);
            }
          }
        }
      });

      /**
       * Animator; watch for timeState.at, show corresponding frame.
       *
       * Lookup timeState.at in frameLookup, set opacity of previous frame
       * to 0, set opacity of currentFrame to 1. Replace previous frame
       * with next frame; If frame is not in lookupFrame, get new images.
       */
      scope.$watch('timeState.at', function (newVal, oldVal) {
        var currentDate = UtilService.roundTimestamp(newVal,
                                             step, false);
        var oldDate = UtilService.roundTimestamp(oldVal,
                                             step, false);
        if (currentDate === oldDate) { return; }
        if (scope.rain.enabled) {
          var overlayIndex = frameLookup[currentDate];
          if (overlayIndex !== undefined &&
              overlayIndex !== previousFrame) {
            // Turn off old frame
            imageOverlays[previousFrame].setOpacity(0);
            // Turn on new frame
            imageOverlays[overlayIndex].setOpacity(0.7);
            // Delete the old overlay from the lookup, it is gone.
            delete frameLookup[currentDate];
            // Remove old listener
            imageOverlays[previousFrame].off('load');
            // Add listener to asynchronously update loadingRaster and framelookup
            addLoadListener(imageOverlays[previousFrame], previousFrame, nxtDate);
            // We are now waiting for one extra raster
            loadingRaster += 1;
            // Tell the old overlay to go and get a new image.
            imageOverlays[previousFrame].setUrl(imageUrlBase +
              utcFormatter(new Date(nxtDate)));

            previousFrame = overlayIndex;
            previousDate = currentDate;
            nxtDate += step;
          } else if (overlayIndex === undefined) {
            console.info("We will have to go get", currentDate, ". Get new images!");
            if (scope.timeState.animation.playing) {
              restart = true;
            }
            scope.timeState.playPauseAnimation('off');
          }
        }
      });

      /**
       * Get new set of images when animation stops playing
       * (resets rasterLoading to 0)
       */
      scope.$watch('timeState.at', function (newVal, oldVal) {
        if (newVal === oldVal) { return; }
        if (!scope.timeState.animation.playing
          && scope.rain.enabled) {
          getImages(scope.timeState.at);
          imageOverlays[0].setOpacity(0.7);
          previousFrame = 0;
        }
      });
    }
  };
}]);
