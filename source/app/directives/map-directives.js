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
      
      var map = MapService.createMap(element[0], {
        bounds: bounds,
        attribution: osmAttrib
      });
      MapService.initiateMapEvents();
      scope.map = map;

      // Initialise layers
      angular.forEach(MapService.mapState.layers, function (layer) {
        MapService.mapState.activeLayersChanged = !MapService.mapState.activeLayersChanged;
        if (!layer.initiated) {
          MapService.createLayer(layer);
        }
        if (layer.active) {
          layer.active = false;
          MapService.toggleLayer(layer, MapService.mapState.layers);
        }
      });

      // initialize empty ClickLayer.
      // Otherwise click of events-aggregate and clicklayer
      ClickFeedbackService.drawClickInSpace(map, new L.LatLng(180.0, 90.0));

      // Instantiate the controller that updates the hash url after creating the 
      // map and all its listeners.
      $controller('hashGetterSetter', {$scope: scope});

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
