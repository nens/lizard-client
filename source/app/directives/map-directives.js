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

app.controller('MapDirCtrl', function ($scope, MapService, $rootScope, $http, $filter) {

  // part of the great refactoring
  this.initiateLayer = MapService.createLayer;
  this.toggleLayer = MapService.toggleLayer;
  this.addLayer = MapService.addLayer;
  this.removeLayer = MapService.removeLayer
  this.createMap = MapService.createMap;
  this.panZoomTo = MapService.setView;
  this.fitBounds = MapService.fitBounds;


  return this;
});


app.directive('map', [
  '$controller',
  '$rootScope',
  'UtilService',
  'ClickFeedbackService',
  'RasterService',
  'MapService',
  function (
    $controller,
    $rootScope,
    UtilService,
    ClickFeedbackService,
    RasterService,
    MapService
    ) {
    var link = function (scope, element, attrs, ctrl) {
      // Leaflet global variable to peed up vector layer,
      // see: http://leafletjs.com/reference.html#path-canvas
      window.L_PREFER_CANVAS = true;
      // instead of 'map' element here for testability
      var osmAttrib = '<a href="https://www.mapbox.com/about/maps/">&copy; Mapbox</a> <a href="http://www.openstreetmap.org/">&copy; OpenStreetMap</a>';
      var bounds = window.data_bounds.all;
      
      var map = MapService.createMap(element[0], {
        bounds: bounds,
        attribution: osmAttrib
      });

      scope.map = map;
      scope.mapState.bounds = scope.map.getBounds();


      // Initialise layers
      angular.forEach(scope.mapState.layers, function (layer) {
        scope.mapState.activeLayersChanged = !scope.mapState.activeLayersChanged;
        if (!layer.initiated) {
          MapService.createLayer(layer);
        }
        if (layer.active) {
          layer.active = false;
          MapService.toggleLayer(layer, scope.mapState.layers);
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

          scope.mapState.activeLayersChanged =
            !scope.mapState.activeLayersChanged;
          layer.active = !layer.active;

          // toggle timeline if neccesary
          if (scope.timeState.hidden !== false) {
            scope.toggleTimeline();
          }

        } else {

          // for other than temporalRaster layers, we do stuff the old way
          ctrl.toggleLayer(layer, scope.mapState.layers, scope.mapState.bounds);
          scope.mapState.activeLayersChanged =
            !scope.mapState.activeLayersChanged;
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

      // Instantiate the controller that updates the hash url after creating the 
      // map and all its listeners.
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
 * Show raster WMS images as overlay, animate overlays when animation is
 * playing.
 */
app.directive('rasteranimation', ["RasterService", "UtilService",
  function (RasterService, UtilService) {
  return {
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      var imageUrlBase;
      var imageBounds = RasterService.rasterInfo().imageBounds;
      var utcFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
      var step = RasterService.rasterInfo().timeResolution;
      var imageOverlays = {};
      var frameLookup = {};
      var numCachedFrames = 30;
      var previousFrame = 0;
      var previousDate;
      var nxtDate;
      var loadingRaster = 0;
      var restart = false;

      /**
       * Setup imageOverlays.
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
       * When a temporal raster is enabled, add imageOverlay layer, and remove
       * the layer it gets disabled.
       */
      scope.$watch('mapState.activeLayersChanged', function (n, o) {

        var i, activeTemporalLayer = scope.mapState.getActiveTemporalLayer();

        if (activeTemporalLayer) {

          for (i in imageOverlays) {
            mapCtrl.addLayer(imageOverlays[i]);
          }
          imageUrlBase = RasterService
                          .rasterInfo(activeTemporalLayer.slug)
                          .imageUrlBase;
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
            // Add listener to asynchronously update loadingRaster and
            // framelookup
            addLoadListener(imageOverlays[previousFrame],
                            previousFrame,
                            nxtDate);
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
              console.info("We will have to go get", currentDate,
                           ". Get new images!");
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
            && scope.mapState.getActiveTemporalLayer()) {
          getImages(scope.timeState.at);
          imageOverlays[0].setOpacity(0.7);
          previousFrame = 0;
        }
      });
    }
  };
}]);
