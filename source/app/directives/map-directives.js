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
 * - [ ] Move $scope out of MapDirCtrl
 * - [ ] Split up massive functions in MapDirCtrl
 * - [ ] Get rain stuff into the directive and the MapDirCtrl
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
      } else if (layer.slug === 'elevation') {
        options.styles = 'BrBG_r';
        options.effects = 'shade:0:3';
      } else if (layer.slug === 'demo/radar') {
        options.styles = 'transparent';
        options.transparent = true;
      }
      layer.leafletLayer = L.tileLayer.wms(layer.url, options);
      //NOTE ugly hack because of ugly hack
      if (layer.slug === 'elevation') {
        elevationLayer = layer.leafletLayer;
      }
    } else if (layer.type === "ASSET") {
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
   * @summary Rescale elevation raster.
   *
   * @desc Makes a request to the raster server with the current bounds
   * Gets a new scale limit and refreshes the layer.
   *
   * @param {object} bounds contains the corners of the current map view.
   */
  var rescaleElevation = function (bounds) {

    // Make request to raster to get min and max of current bounds
    var url = 'https://raster.lizard.net/wms' + '?request=getlimits&layers=elevation' +
      '&width=16&height=16&srs=epsg:4326&bbox=' +
      bounds.toBBoxString();
    $http.get(url).success(function (data) {
      var limits = ':' + data[0][0] + ':' + data[0][1];
      var styles = 'BrBG_r' + limits;
      elevationLayer.setParams({styles: styles}, true);
      elevationLayer.redraw();
    });
  };

  this.toggleLayer = function (layer, layers, bounds) {
    if (layer.baselayer) {
      if (!layer.active) { layer.active = true; }
      else if (layer.slug === 'elevation') { rescaleElevation(bounds); }
      turnOffAllOtherBaselayers(layer.id, layers);
    } else {
      if (layer.overlayer)
        updateOverLayers(layers);
      layer.active = !layer.active;
    }

    if (!layer.active) {
      $scope.map.removeLayer(layer.leafletLayer);
      if (layer.grid_layer) {
        $scope.map.removeLayer(layer.grid_layer);
      }
    }

    if (layer.active) {
      $scope.map.addLayer(layer.leafletLayer);
      if (layer.grid_layer) {
        layer.leafletLayer.on('load', function () {
          // Add the grid layers of the layer when load finished
          $scope.map.addLayer(layer.grid_layer);
          layer.grid_layer.on('load', function () {
            // Broadcast a load finished message to a.o. aggregate-directive
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
    }
  };

  var turnOffAllOtherBaselayers = function (id, layers) {
    angular.forEach(layers, function (i) {
      if (i.baselayer && i.id !== id && i.active) {
        i.active = false;
        $scope.map.removeLayer(i.leafletLayer);
      }
    });
  };

  /**
   * Update overlayer opacities.
   *
   * TODO: Remove overlayers
   */
  var updateOverLayers = function (layers) {
    var numLayers = 1;
    angular.forEach(layers, function (layer) {
      if ((layer.overlayer === true) && (layer.active)) {
        numLayers++;
      }
    });
    angular.forEach($filter('orderBy')(layers, 'z_index', true), function (layer) {
      if ((layer.overlayer === true) && (layer.active)) {
        layer.leafletLayer.setOpacity(1 / numLayers);
        numLayers--;
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
   * @param {object} activeBaselayer
   * @param {string} currentType current box type
   * @return {string} newType new box type
   *
   */
  this.boxType = function (mapState) {
    var newState = ($scope.box.type === 'profile') ? 'profile' : 'extentAggregate';
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


app.directive('map', [
  '$controller',
  '$rootScope',
  'UtilService',
  'ClickFeedbackService',
  'RasterService',
  function (
    $controller,
    $rootScope,
    UtilService,
    ClickFeedbackService,
    RasterService
    ) {
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

      scope.mapState.switchLayerOrRescaleElevation = function (layer) {

        if (layer.name === 'Hoogtekaart'
            && scope.mapState.activeBaselayer === 3) {
          ctrl.rescaleElevation(scope.mapState.bounds);

        } else {
          scope.mapState.changeBaselayer(layer);
        }
      };

      map.fitBounds(maxBounds);
      map.attributionControl.addAttribution(osmAttrib);
      map.attributionControl.setPrefix('');
      UtilService.getZoomlevelLabel(map.getZoom());
      scope.map = map;
      scope.mapState.bounds = scope.map.getBounds();
      // to calculate imageURLs
      scope.mapState.pixelCenter = scope.map.getPixelBounds().getCenter();
      scope.mapState.zoom = scope.map.getZoom();

      // Initialise layers
      angular.forEach(scope.mapState.layers, function (layer) {
        scope.mapState.activeLayersChanged = !scope.mapState.activeLayersChanged;
        if (!layer.initiated) {
          ctrl.initiateLayer(layer);
        }
        if (layer.active) {
          layer.active = false;
          ctrl.toggleLayer(layer, scope.mapState.layers, scope.mapState.bounds);
        }
      });

      var clicked = function (e) {
        scope.mapState.here = e.latlng;
        if (scope.box.type !== 'intersect') {
          scope.box.type = 'pointObject';
          $rootScope.$broadcast('newPointObject');
        }
      };

      scope.map.on('click', function (e) {
        // NOTE: Check whether a $digest is already happening before using apply
        if (!scope.$$phase) {
          scope.$apply(function () {
            clicked(e);
          });
        } else {
          clicked(e);
        }
      });

      scope.map.on('movestart', function () {

        if (!scope.$$phase) {
          scope.$apply(function () {
            scope.mapState.mapMoving = true;
          });
        } else {
          scope.mapState.mapMoving = true;
        }
      });

      /**
       * Sets the geolocation of the users mouse to the mapState
       * Used to draw clickfeedback.
       */
      scope.map.on('mousemove', function (e) {
        if (!scope.$$phase) {
          scope.$apply(function () {
            scope.mapState.userHere = e.latlng;
          });
        } else {
          scope.mapState.userHere = e.latlng;
        }
      });

      // initialize empty ClickLayer.
      // Otherwise click of events-aggregate and clicklayer
      ClickFeedbackService.drawClickInSpace(map, new L.LatLng(180.0, 90.0));

      scope.map.on('moveend', function () {

        // NOTE: Check whether a $digest is already happening before using apply

        var finalizeMove = function () {
          scope.mapState.moved = Date.now();
          scope.mapState.mapMoving = false;
          scope.mapState.pixelCenter = scope.map.getPixelBounds().getCenter();
          scope.mapState.zoom = scope.map.getZoom();
          scope.mapState.bounds = scope.map.getBounds();
        };

        if (!scope.$$phase) {
          scope.$apply(finalizeMove);
        } else {
          finalizeMove();
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

        if (layer.temporal) {

          scope.mapState.activeLayersChanged = !scope.mapState.activeLayersChanged;
          layer.active = !layer.active;

          // toggle timeline if neccesary
          if (scope.timeState.hidden !== false) {
            scope.toggleTimeline();
          }

        } else {

          // for other than temporalRaster layers, we do stuff the old way
          ctrl.toggleLayer(layer, scope.mapState.layers, scope.mapState.bounds);
          scope.mapState.activeLayersChanged = !scope.mapState.activeLayersChanged;
        }
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
  }
]);

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

      imageOverlays = RasterService.getImgOverlays(
        numCachedFrames,
        imageBounds
      );

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

        nxtDate = UtilService.roundTimestamp(
          scope.timeState.at,
          step,
          false
        );
        // writing outer-scope variables..
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
      scope.$watch('mapState.activeLayersChanged', function (n, o) {

        var i, hasActiveTemporalLayer = !!scope.mapState.getActiveTemporalLayer();

        if (hasActiveTemporalLayer) {

          for (i in imageOverlays) {
            mapCtrl.addLayer(imageOverlays[i]);
          }

          getImages(scope.timeState.at);

        } else {

          for (i in imageOverlays) {
            mapCtrl.removeLayer(imageOverlays[i]);
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

        //if (scope.tools.active === 'rain') {
        if (scope.mapState.getActiveTemporalLayer()) {

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
            if (JS_DEBUG) {
              console.info("We will have to go get", currentDate, ". Get new images!");
            }
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
          && scope.tools.active === 'rain') {
          getImages(scope.timeState.at);
          imageOverlays[0].setOpacity(0.7);
          previousFrame = 0;
        }
      });
    }
  };
}]);
