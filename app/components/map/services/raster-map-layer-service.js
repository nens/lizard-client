'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('rasterMapLayer', ['$q', 'LeafletService', 'MapLayerService', 'RasterService', 'UtilService',
  function ($q, LeafletService, MapLayerService, RasterService, UtilService) {

    return function (options) {

      var rasterMapLayer = {};

      rasterMapLayer.uuid = options.uuid;

      // Base of the image url without the time.
      rasterMapLayer._imageUrlBase = options.url;

      // Array of imageoverlays used as buffer.
      rasterMapLayer._imageOverlays = [];

      // Formatter used to format a data object.
      var _formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

      // Lookup to store which data correspond to which imageOverlay.
      rasterMapLayer._frameLookup = {};

      rasterMapLayer._temporalResolution = options.temporalResolution;

      // Length of the buffer, set in the initialization. Ideally the buffer
      // is small to get up to speed fast, for slow connections or high
      // frequent images it should be large. When having a very sparse
      // resolution, animation will also move slowly, so there is no need
      // for a big buffer.
      rasterMapLayer._bufferLength = options.temporalResolution >= 3600000 ? 2 : 6;

      // Number of rasters currently underway.
      rasterMapLayer._nLoadingRasters = 0;

      rasterMapLayer.update = function (map, timeState, options) {
        console.log(rasterMapLayer);
        var promise;

        if (rasterMapLayer.temporal) {
          promise = rasterMapLayer._syncTime();
        }

        else if (!map.hasLayer(rasterMapLayer._imageOverlays[0])) {
          promise = rasterMapLayer._add(map, timeState, options);
        }

        return promise;
      };


      /**
       * @description removes all _imageOverlays from the map. Removes
       *              listeners from the _imageOverlays, the _imageOverlays
       *              from this layer and removes the references to
       *              the _imageOverlays.
       */
      rasterMapLayer.remove = function (map) {
        for (var i in rasterMapLayer._imageOverlays) {
          if (map.hasLayer(rasterMapLayer._imageOverlays[i])) {
            rasterMapLayer._imageOverlays[i].off('load');
            map.removeLayer(rasterMapLayer._imageOverlays[i]);
          }
        }
        rasterMapLayer._nLoadingRasters = 0;
        rasterMapLayer._imageOverlays = [];
        rasterMapLayer._frameLookup = {};
      };

      /**
       * @description Adds one imageOverlay with the current time to the map.
       * @return a promise that resolves when the image has loaded. Usefull
       *         for sequential loading of layers.
       */
      rasterMapLayer._add = function (map, timeState, options, optionalDefer) {

        var defer = optionalDefer || $q.defer(),
            opacity = options.opacity,
            date = new Date(rasterMapLayer._mkTimeStamp(timeState.at)),
            store = rasterMapLayer._determineStore(timeState);

        var opts = {
          layers: store.name,
          format: 'image/png',
          version: '1.1.1',
          minZoom: 0,
          maxZoom: 21,
          opacity: options.opacity,
          zIndex: options.zIndex,
          crs: LeafletService.CRS.EPSG3857,
          time: _formatter(date)
        };

        options = angular.extend(opts, options);

        var url = RasterService.buildURLforWMS(
          rasterMapLayer._imageUrlBase,
          rasterMapLayer.uuid,
          map,
          false,
          options
        );

        rasterMapLayer._imageOverlays = [
          LeafletService.tileLayer.wms(url, options)
        ];

        // defer is passed to loadlistener to be resolved when done.
        rasterMapLayer._addLoadListener(
          rasterMapLayer._imageOverlays[0].addTo(map),
          timeState.at,
          defer
        );

        return defer.promise;
      };

      /**
       * @summary    Sets the new timeState on the layer. And updates the layer
       *             to the new time.
       *
       * @parameter timeState nxt object containing current time on at.
       * @parameter map leaflet map to add layers to.
       *
       * @return a promise that resolves when the layer has finished
       *         syncing. It is considered finished when it finishes loading
       *         a new buffer or when it was able to set a new frame from its
       *         buffer.
       */
      rasterMapLayer._syncTime =  function (timeState, map) {
        var defer = $q.defer();

        // this only works for stores with different aggregation levels
        // for now this is only for the radar stores
        // change image url based on timestate.
        var store = rasterMapLayer._determineStore(timeState);

        rasterMapLayer._temporalResolution = store.resolution;

        // This breaks styles with negative values
        // and for the moment only applies to radar.
        if (rasterMapLayer.slug.split('/')[0] === 'radar') {
          rasterMapLayer.options.styles = rasterMapLayer.options.styles.split('-')[0]
            + '-'
            + store.name.split('/')[1];
        }

        // Continue when layers need to update to new time.
        if (rasterMapLayer._imageOverlays.length) {
          rasterMapLayer._syncToNewTime(timeState, map, defer);
        }

        return defer.promise;
      };

      /**
       * @description sets the provided opacity to the layer and all the
       *              _imageOverlays that have an opacity other than 0. Sets
       *              the opacity to nearly 0 when the provided opacity is
       *              exactly 0 in order to distinguish layers that are off
       *              and layers that have are transparant.
       */
      rasterMapLayer._setOpacity = function (opacity) {
        if (opacity === 0) { opacity = 0.1; }
        angular.forEach(rasterMapLayer._frameLookup, function (frameIndex) {
          if (rasterMapLayer._imageOverlays[frameIndex].options.opacity !== 0) {
            rasterMapLayer._imageOverlays[frameIndex].setOpacity(opacity);
          }
        });
        return;
      };

      /**
       * Takes a new timeState and delegates to sync functions for
       * animation or non-animation.
       * @param  {object} map         leaflet map
       * @param  {int}    currentDate ms from epoch
       * @param  {object} defer       defer to resolve when done
       */
      rasterMapLayer._syncToNewTime = function (timeState, map, defer) {
        var currentDate = rasterMapLayer._mkTimeStamp(timeState.at);
        if (timeState.playing) {
          rasterMapLayer._animateSyncTime(map, currentDate, defer);
        }
        else {
          rasterMapLayer._tiledSyncTime(map, currentDate, defer);
        }
      };

      /**
       * syncToTime with a tiled layer. Simpy removes everything and uses
       * add method to create a new tiled layer
       * @param  {object} map         leaflet map
       * @param  {int}    currentDate ms from epoch
       * @param  {object} defer       defer to resolve when done
       */
      rasterMapLayer._tiledSyncTime = function (map, currentDate, defer) {
        rasterMapLayer.remove(map);
        rasterMapLayer._add(map, defer);
      };

      /**
       * syncToTime with imageOverlays for animation. See syncTime docstr
       * for more info.
       *
       * @decription When there are not enough or the imageOverlays have
       *             an outdated bounds, more overlays are added to the
       *             map. The curent timeState.at is rounded
       *             to the nearest date value present on the wms server. The
       *             currentDate value is used to lookup the index of the
       *             frame in the _frameLookup. The _frameLookup contains all
       *             the dates that are present in the buffer and the index
       *             of the imageoverlay it is stored on:
       *
       *               { <date in ms from epoch> : <index on _imageOverlays> }
       *
       *               length is 0, 1 or _bufferLength.
       *
       *             The date is either: 1. present in the lookup in case the
       *             index is defined or 2. not present in case this frame is
       *             not loaded yet.
       *
       *             When 1. The imageOverlay with index <currentOverlayIndex>
       *             is set to _opacity and the defer is resolved. The image
       *             sources of the _imageOverlays with opacity !== 0 are set
       *             to the next date not in the _frameLookup, the opacity is
       *             set to 0 and the reference is removed from the
       *             _frameLookup. A loadListener adds a new reference to the
       *             _frameLookup when the layer finishes loading a new frame.
       *
       *             When 2. All references are removed and all layers get a
       *             new source. When the new source is different than the one
       *             it currently has, the loadListener is removed and a new
       *             one source and loadlistener are added. When all layers
       *             have loaded, the first layer's opacity is set to _opacity
       *             and the defer is resolved.
       *
       * @param  {object} map         leaflet map
       * @param  {int}    currentDate ms from epoch
       * @param  {object} defer       defer to resolve when done
       */
      rasterMapLayer._animateSyncTime = function (map, currentDate, defer) {
        var newBounds = rasterMapLayer._getAnimationBounds(map);

        if (rasterMapLayer._imageOverlays.length < rasterMapLayer._bufferLength
          || newBounds.getNorth() !== rasterMapLayer._animationBounds.getNorth()
          || newBounds.getWest() !== rasterMapLayer._animationBounds.getWest()) {
          rasterMapLayer._animationBounds = newBounds;

          // add leaflet layers to fill up the buffer and set imageUrlBase
          // which depends on the bounds of the map and the layer and the
          // store that corresponds to the timeState.

          var store = rasterMapLayer._determineStore(rasterMapLayer.timeState);

          var options = {
            bounds: rasterMapLayer._animationBounds,
            size: rasterMapLayer._getImageSize(map, rasterMapLayer._animationBounds)
          };

          rasterMapLayer._imageUrlBase = RasterService.buildURLforWMS(
            rasterMapLayer._imageUrlBase,
            rasterMapLayer.uuid,
            map,
            rasterMapLayer.timeState.playing,
            options
          );

          rasterMapLayer._imageOverlays = rasterMapLayer._createImageOverlays(
            map,
            rasterMapLayer._bufferLength,
            rasterMapLayer._animationBounds
          );
        }

        var currentOverlayIndex = rasterMapLayer._frameLookup[currentDate];

        if (currentOverlayIndex === undefined) {
          // Ran out of buffered frames
          rasterMapLayer._imageOverlays = rasterMapLayer._fetchNewFrames(
            currentDate,
            rasterMapLayer._imageOverlays,
            defer
          );
        }

        else {
          rasterMapLayer._progressFrame(currentOverlayIndex);
          // Done!
          defer.resolve();
        }

      };

      /**
       * @description Adds new imageoverlays.
       * @param  {L.Map} map.
       * @param  {overlays} overlays current overlays to add to.
       * @param  {bounds} bounds   bounds of overlays.
       * @param  {int} buffer   amount of imageOverlays to include.
       * @return {array} array of L.imageOverlays.
       */
      rasterMapLayer._createImageOverlays = function (map, buffer, bounds) {
        // detach all listeners and references to the imageOverlays.
        rasterMapLayer.remove(map);
        // create new ones.
        for (var i = rasterMapLayer._imageOverlays.length; i < buffer; i++) {
          rasterMapLayer._imageOverlays.push(
            LeafletService.imageOverlay('', bounds).addTo(map)
          );
        }
        return rasterMapLayer._imageOverlays;
      };

      /**
       * Takes the bounds of the map and creates an intersection of the
       * layer and the map for animation.
       *
       * @param  {L.Map} map with getBounds
       * @return {L.LatLngBounds} leaflet bounds of intersection
       */
      rasterMapLayer._getAnimationBounds = function (map) {
        var mapBounds = map.getBounds();

        var smallestSoutWest = LeafletService.latLng(
          Math.max(rasterMapLayer.bounds.south, mapBounds.getSouth()),
          Math.max(rasterMapLayer.bounds.west, mapBounds.getWest())
        );

        var smallesNorthEast = LeafletService.latLng(
          Math.min(rasterMapLayer.bounds.north, mapBounds.getNorth()),
          Math.min(rasterMapLayer.bounds.east, mapBounds.getEast())
        );

        return LeafletService.latLngBounds(
          smallestSoutWest,
          smallesNorthEast
        );

      };

      /**
       * Determines the pixel size of the imageoverlay on the map.
       *
       * @param  {L.Map} map
       * @param  {L.LatLngBounds} animationBounds intersection of map
       *                          bounds and layer bounds.
       *
       * @return {object}  object with x and y size in horizontal (x) and
       *                               vertical (y) direction.
       */
      rasterMapLayer._getImageSize = function (map, animationBounds) {
        var bottomLeft = map.latLngToContainerPoint(
          animationBounds.getSouthWest()
        );

        var topRight = map.latLngToContainerPoint(
          animationBounds.getNorthEast()
        );

        return {
          x : topRight.x - bottomLeft.x,
          y: bottomLeft.y- topRight.y
        };
      };

      /**
       * Local helper that returns a rounded timestamp
       */
      rasterMapLayer._mkTimeStamp = function (t) {
        var result = UtilService.roundTimestamp(t, rasterMapLayer._temporalResolution, false);
        return result;
      };

      /**
       * @description based on the temporal window. The time between
       * timestate.start and timestate.end determines which store is to be used.
       * This only works for radar stuff.
       *
       */
      rasterMapLayer._determineStore = function (timeState) {

        return {
          name: rasterMapLayer.uuid,
          resolution: rasterMapLayer._temporalResolution
        };

      };


      /**
       * @description Removes old frame by looking for a frame that has an
       *              opacity that is not 0 and setting it to 0, deleting it
       *              from the lookup and replacing the image source. NewFrame
       *              is turned on by setting opacity to _opacity.
       * @param {int} currentOverlayIndex index of the overlay in
       *              _imageOverlays.
       */
      rasterMapLayer._progressFrame = function (currentOverlayIndex) {
        angular.forEach(rasterMapLayer._frameLookup, function (frameIndex, key) {

          if (rasterMapLayer._imageOverlays[frameIndex].options.opacity !== 0
            && frameIndex !== currentOverlayIndex) {
            // Delete the old overlay from the lookup, it is gone.
            delete rasterMapLayer._frameLookup[key];
            rasterMapLayer._replaceUrlFromFrame(frameIndex);
          }
        });

        var newFrame = rasterMapLayer._imageOverlays[currentOverlayIndex];
        // Turn on new frame
        newFrame.setOpacity(rasterMapLayer._opacity);
      };

      /**
       * @description Replaces the image source of the provided frame. Turns
       *              frame off by setting opacity to 0. When new url is
       *              different from previous, removes loadlistener, replaces
       *              url and adds new loadlistener. When new url is the same
       *              puts the old one back in the frameLookup and turns it
       *              back on when thge first of the list. When defer is
       *              provided passes it on the loadlistener that resolves it
       *              whenn all layers finished loading.
       * @param {int} currentOverlayIndex index of the overlay in
       * @param {defer} defer <optional> gets resolved when image is loaded
       *                      and _nLoadingRasters === 0.
       */
      rasterMapLayer._replaceUrlFromFrame = function (frameIndex, defer) {
        var url = rasterMapLayer._imageUrlBase + _formatter(new Date(rasterMapLayer._nxtDate));
        var frame = rasterMapLayer._imageOverlays[frameIndex];
        frame.off('load');
        frame.setOpacity(0);
        if (url !== frame._url) {
          rasterMapLayer._addLoadListener(frame, rasterMapLayer._nxtDate, defer);
          frame.setUrl(url);
        }
        else {
          var index = rasterMapLayer._imageOverlays.indexOf(frame);
          rasterMapLayer._frameLookup[rasterMapLayer._nxtDate] = index;
          if (index === 0) {
            rasterMapLayer._imageOverlays[0].setOpacity(rasterMapLayer._opacity);
          }
        }
        rasterMapLayer._nxtDate += rasterMapLayer._temporalResolution;
      };

      /**
       * @description Removes all references, sets _nLoadingRasters to 0. And
       *              calls replaceUrlFromFrame for every frame in the
       *              provided overlays
       *
       * @param {int} currentData in ms from epoch
       * @param {array} overlays L.ImageOverlay s
       * @param {defer} defer that gets resolved when all frames finished
       *                      loading.
       */
      rasterMapLayer._fetchNewFrames = function (currentDate, overlays, defer) {
        rasterMapLayer._nxtDate = currentDate;
        rasterMapLayer._frameLookup = {};
        rasterMapLayer._nLoadingRasters = 0;

        angular.forEach(overlays, function (overlay, i) {
          rasterMapLayer._replaceUrlFromFrame(i, defer);
        });

        return overlays;
      };

      /**
       * @description Adds loadlistener to the provided overlay. On load a
       *              reference to the image is added to the _frameLookup,
       *              turns first layer on when defer was provided and
       *              resolves defer when provided and all images are loaded.
       * @param {L.ImageOverlay} overlay to add listener to
       * @param {int} data in ms from epoch the overlay belongs to.
       * @param {object} defer defer to resolve when all layers finished
       *                       loading.
       */
      rasterMapLayer._addLoadListener = function (overlay, date, defer) {
        rasterMapLayer._nLoadingRasters++;
        overlay.addOneTimeEventListener("load", function () {
          rasterMapLayer._nLoadingRasters--;
          var index = rasterMapLayer._imageOverlays.indexOf(overlay);
          rasterMapLayer._frameLookup[date] = index;
          if (defer && index === 0) {
            rasterMapLayer._imageOverlays[0].setOpacity(rasterMapLayer._opacity);
          }
          if (defer && rasterMapLayer._nLoadingRasters === 0) {
            defer.resolve();
          }
        });
      };

    return rasterMapLayer;
  };

}]);
