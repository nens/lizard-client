'use strict';

/**
 * Map directive
 *
 * Overview
 * ========
 *
 * Defines the map. Directive does all the watching and DOM binding, MapDirCtrl
 * holds all the testable logic. Ideally the directive has no logic and the
 * MapDirCtrl is independent of the rest of the application.
 *
 */
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
    var link = function (scope, element, attrs) {

      // instead of 'map' element here for testability
      var osmAttrib = '<a href="https://www.mapbox.com/about/maps/">&copy; Mapbox</a> <a href="http://www.openstreetmap.org/">&copy; OpenStreetMap</a>';
      var bounds = window.data_bounds.all;

      MapService.createMap(element[0], {
        bounds: bounds,
        attribution: osmAttrib
      });
      MapService.initiateMapEvents();
      scope.mapState.layersNeedLoading = true;

      // Instantiate the controller that updates the hash url after creating the
      // map and all its listeners.
      $controller('UrlController', {$scope: scope});

      // initialize empty ClickLayer.
      // Otherwise click of events-aggregate and clicklayer
      ClickFeedbackService.drawClickInSpace(new L.LatLng(180.0, 90.0));
    };

    return {
      restrict: 'E',
      replace: true,
      template: '<div id="map"></div>',
      link: link
    };
  }
]);

/**
 * Show raster WMS images as overlay, animate overlays when animation is
 * playing.
 */
app.directive('rasteranimation', ['RasterService', 'UtilService', 'MapService',
  function (RasterService, UtilService, MapService) {
  return {
    link: function (scope, element, attrs) {

      var imageUrlBase;
      var imageBounds = [];
      var utcFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
      var step = [];
      var imageOverlays = {};
      var frameLookup = {};
      // numCachedFrames is now dynamic: the amt. of cached frames for mobile users
      // is only half of that for non-mobile users.
      var numCachedFrames = UtilService.serveToMobileDevice() ? 15 : 30;
      var previousFrame = 0;
      var previousDate;
      var nxtDate;
      var loadingRaster = 0;
      var restart = false;
      var initiated = false;

      var start = function () {
        imageBounds = RasterService.rasterInfo(scope.mapState.getActiveTemporalLayer().slug).imageBounds;
        utcFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
        step = RasterService.rasterInfo(scope.mapState.getActiveTemporalLayer().slug).timeResolution;
        imageOverlays = {};
        frameLookup = {};
        numCachedFrames = 30;
        previousFrame = 0;
        loadingRaster = 0;
        restart = false;

        /**
         * Setup imageOverlays.
         */
        imageOverlays = RasterService.getImgOverlays(
          numCachedFrames,
          imageBounds
        );
        initiated = true;
      };


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
        if (activeTemporalLayer && activeTemporalLayer.layers[0].type === 'WMS') {
          start();
          for (i in imageOverlays) {
            MapService.addLayer(imageOverlays[i]);
          }
          imageUrlBase = RasterService
                          .rasterInfo(activeTemporalLayer.slug)
                          .imageUrlBase;
          getImages(scope.timeState.at);

        } else {
          for (i in imageOverlays) {
            MapService.removeLayer(imageOverlays[i]);
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
        if (newVal === oldVal || !initiated) { return; }
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
            // if (JS_DEBUG) {
            //   console.info("We will have to go get", currentDate,
            //                ". Get new images!");
            // }
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
        if (!scope.timeState.animation.playing &&
            scope.mapState.getActiveTemporalLayer() &&
            scope.mapState.initiated) {
          if (!initiated) { return; }
          getImages(scope.timeState.at);
          imageOverlays[0].setOpacity(0.7);
          previousFrame = 0;
        }
      });
    }
  };
}]);
