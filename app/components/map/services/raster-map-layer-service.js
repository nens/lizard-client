'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('rasterMapLayer', ['$rootScope', '$http', 'LeafletService', 'MapLayerService', 'RasterService', 'UtilService',
  function ($rootScope, $http, LeafletService, MapLayerService, RasterService, UtilService) {

    return function (options) {

      var rasterMapLayer = options;

      rasterMapLayer.loading = false;
      rasterMapLayer.vectorized = false;

      // Base of the image url without the time.
      rasterMapLayer._imageUrlBase = options.url;

      // Array of imageoverlays used as buffer.
      rasterMapLayer._imageOverlays = [];

      // Formatter used to format a data object.
      var _formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

      // Lookup to store which data correspond to which imageOverlay.
      rasterMapLayer._frameLookup = {};

      // Length of the buffer, set in the initialization. Ideally the buffer
      // is small to get up to speed fast, for slow connections or high
      // frequent images it should be large. When having a very sparse
      // resolution, animation will also move slowly, so there is no need
      // for a big buffer.
      rasterMapLayer._bufferLength = options.frequency >= 3600000 ? 2 : 6;

      // Number of rasters currently underway.
      rasterMapLayer._nLoadingRasters = 0;

      // Support pre layergroup refactored rasters. Use slug if no layers in
      // options
      if (!rasterMapLayer.complexWmsOptions.layers) {
        rasterMapLayer.complexWmsOptions.layers = rasterMapLayer.slug;
      }

      // ComplexWmsOptions might have options per zoom and aggWindow. Add layer
      // with default options.
      var params = RasterService.getWmsParameters(
        options.complexWmsOptions,
        0,
        0
      );

      rasterMapLayer.update = function (map, timeState, options) {
        // Wms options might be different for current zoom and aggWindow.
        // Redraw when wms parameters are different for temporal or spatial
        // zoom.
        var newParams = RasterService.getWmsParameters(
          rasterMapLayer.complexWmsOptions,
          map.getZoom(),
          timeState.aggWindow
        );

        // Use opacity of lizard-client-layer as defined in favourite or altered
        // by user through opacity-slider and passed through options object by
        // mapservice.
        newParams.opacity = options.opacity;
        rasterMapLayer._setOpacity(options.opacity);

        if (options.vectorized) {
          rasterMapLayer.removeWms(map);
          rasterMapLayer.updateVectorizedData();
          return;
        } else {
          rasterMapLayer.removeWms(map);
        }

        if (rasterMapLayer.temporal && timeState.playing) {
          rasterMapLayer._syncTime(timeState, map, options, options);
        }

        // flattened parameters can be different per zoomlevel in space and time.
        // only update layer when changed to prevent flickering.
        else if (rasterMapLayer.temporal || !_.isEqual(newParams, params)) {
          // Keep track of changes to paramaters for next update.
          params = newParams;
          rasterMapLayer.removeWms(map);
          rasterMapLayer._add(timeState, map, params);
        }

        else if (!map.hasLayer(rasterMapLayer._imageOverlays[0])) {
          rasterMapLayer._add(timeState, map, params);
        }

      };

      rasterMapLayer._updateStyling = function (properties, stylingDict) {
        if (properties.raster && properties.raster.color) {
          stylingDict.fillColor = properties.raster.color;
          stylingDict.fillOpacity = rasterMapLayer._opacity;
        } else {
          stylingDict.fillColor = '#fff';
          stylingDict.fillOpacity = rasterMapLayer._opacity;
        }
      };

      /**
       * @description Creates a new L.NxtAjaxGeoJSON layer for a vectorized
       *              raster, and adds that to the current rasterMapLayer
       *              instance.
       */
      rasterMapLayer.updateVectorizedData = function () {
        var defaultRegionStyle = {
          weight: 2,
          opacity: 0.6,
          color: '#7f8c8d', // asbestos,
          fillOpacity: rasterMapLayer._opacity
        };
        var MOUSE_OVER_OPACITY_MULTIPLIER = 0.3;
        var uuid = rasterMapLayer.uuid;
        var styles = rasterMapLayer.complexWmsOptions.styles;
        var leafletLayer = LeafletService.nxtAjaxGeoJSON('api/v2/regions/', {
          // Add these static parameters to requests.
          requestParams: {
            raster: uuid,
            styles: styles,
            page_size: 500
          },
          // Add bbox to the request and update on map move.
          bbox: true,
          // Add zoomlevel to the request and update on map zoom.
          zoom: true,
          style: function (feature) {
            rasterMapLayer._updateStyling(feature.properties, defaultRegionStyle);
            return defaultRegionStyle;
          },
          onEachFeature: function (d, layer) {
            layer.on({
              mouseover: function (e) {
                e.target.setStyle({
                  // TODO: Multiply this with layer opacity (when moved to
                  // RasterMapLayerFactory)
                  fillOpacity:
                    MOUSE_OVER_OPACITY_MULTIPLIER * rasterMapLayer._opacity
                });
              },
              mouseout: function (e) {
                rasterMapLayer._updateStyling(d.properties, defaultRegionStyle);
                e.target.setStyle(defaultRegionStyle);
              },
            });
          },
        });
        rasterMapLayer.leafletLayer = leafletLayer;
      };

      /**
       * @description removes all _imageOverlays from the map. Removes
       *              listeners from the _imageOverlays, the _imageOverlays
       *              from this layer and removes the references to
       *              the _imageOverlays.
       */
      rasterMapLayer.removeWms = function (map) {
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

      rasterMapLayer.rescale = function (bounds) {
        // The wms "layers" parameter should be the slug, but some raster-stores
        // have multiple layers (i.e. rain) for different zoomlevels. Ideally
        // we only use the uuid to identify the raster-store. This code works
        // for elevation, but is a problematic solution.
        if (!rasterMapLayer.temporal) {
          var url = rasterMapLayer._imageUrlBase +
            '?request=getlimits&layers=' +
            rasterMapLayer.slug +
            '&width=16&height=16&srs=epsg:4326&bbox=' +
            bounds.toBBoxString();
          $http.get(url).success(function (data) {
            var limits = ':' + data[0][0] + ':' + data[0][1];
            // strip existing domain if already present.
            rasterMapLayer.complexWmsOptions.styles = rasterMapLayer
            .complexWmsOptions.styles.split(':')[0];
            rasterMapLayer._imageOverlays[0].setParams({
              styles: rasterMapLayer.complexWmsOptions.styles + limits
            });
            rasterMapLayer._imageOverlays[0].redraw();
          });
        }
      };

      /**
       * @description Adds one imageOverlay with the current time to the map.
       * @return a promise that resolves when the image has loaded. Usefull
       *         for sequential loading of layers.
       */
      rasterMapLayer._add = function (timeState, map, options) {

        var date = new Date(rasterMapLayer._mkTimeStamp(timeState.at));

        var defaultOptions = {
          format: 'image/png',
          version: '1.1.1',
          minZoom: 0,
          maxZoom: 21,
          crs: LeafletService.CRS.EPSG3857,
          time: _formatter(date)
        };

        // Overwrite defaults with configured and user defined wms options.
        var opts = _.merge(defaultOptions, options);

        rasterMapLayer._imageOverlays = [
          LeafletService.tileLayer.wms(rasterMapLayer._imageUrlBase, opts)
        ];

        rasterMapLayer._addLoadListener(
          rasterMapLayer._imageOverlays[0].addTo(map),
          timeState.at
        );
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
        rasterMapLayer._opacity = opacity;
        return;
      };

      /**
       * Takes a new timeState and delegates to sync functions for
       * animation or non-animation.
       * @param  {object} map         leaflet map
       * @param  {int}    currentDate ms from epoch
       */
      rasterMapLayer._syncTime = function (timeState, map, wmsOptions) {
        var currentDate = rasterMapLayer._mkTimeStamp(timeState.at);
        rasterMapLayer._animateSyncTime(timeState, map, currentDate, wmsOptions);
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
       */
      rasterMapLayer._animateSyncTime = function (timeState, map, currentDate, wmsOptions) {
        var newBounds = rasterMapLayer._getAnimationBounds(map);

        if (rasterMapLayer._imageOverlays.length < rasterMapLayer._bufferLength
          || newBounds.getNorth() !== rasterMapLayer._animationBounds.getNorth()
          || newBounds.getWest() !== rasterMapLayer._animationBounds.getWest()) {
          rasterMapLayer._animationBounds = newBounds;

          // add leaflet layers to fill up the buffer and set imageUrlBase
          // which depends on the bounds of the map and the layer and the
          // store that corresponds to the timeState.

          var options = {
            bounds: rasterMapLayer._animationBounds,
            size: rasterMapLayer._getImageSize(map, rasterMapLayer._animationBounds),
            frequency: rasterMapLayer.frequency
          };

          rasterMapLayer.url = RasterService.buildURLforWMS(
            rasterMapLayer._imageUrlBase,
            map,
            timeState.playing,
            rasterMapLayer.complexWmsOptions,
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
            rasterMapLayer._imageOverlays
          );
        }

        else {
          rasterMapLayer._progressFrame(currentOverlayIndex, wmsOptions);
          // Done!
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
        rasterMapLayer.removeWms(map);
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
        var result = UtilService.roundTimestamp(t, rasterMapLayer.frequency, false);
        return result;
      };

      /**
       * @description Removes old frame by looking for a frame that has an
       *              opacity that is not 0 and setting it to 0, deleting it
       *              from the lookup and replacing the image source. NewFrame
       *              is turned on by setting opacity to _opacity.
       * @param {int} currentOverlayIndex index of the overlay in
       *              _imageOverlays.
       */
      rasterMapLayer._progressFrame = function (currentOverlayIndex, wmsOptions) {
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
      rasterMapLayer._replaceUrlFromFrame = function (frameIndex) {
        var url = rasterMapLayer.url + _formatter(new Date(rasterMapLayer._nxtDate));
        var frame = rasterMapLayer._imageOverlays[frameIndex];
        frame.off('load');
        frame.setOpacity(0);
        if (url !== frame._url) {
          rasterMapLayer._addLoadListener(frame, rasterMapLayer._nxtDate);
          frame.setUrl(url);
        }
        else {
          var index = rasterMapLayer._imageOverlays.indexOf(frame);
          rasterMapLayer._frameLookup[rasterMapLayer._nxtDate] = index;
          if (index === 0) {
            rasterMapLayer._imageOverlays[0].setOpacity(rasterMapLayer._opacity);
          }
        }
        rasterMapLayer._nxtDate += rasterMapLayer.frequency;
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
      rasterMapLayer._fetchNewFrames = function (currentDate, overlays) {
        rasterMapLayer._nxtDate = currentDate;
        rasterMapLayer._frameLookup = {};
        rasterMapLayer._nLoadingRasters = 0;

        angular.forEach(overlays, function (overlay, i) {
          rasterMapLayer._replaceUrlFromFrame(i);
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
      rasterMapLayer._addLoadListener = function (overlay, date) {
        rasterMapLayer._nLoadingRasters++;

        // Only set raster is loading to true when it is truly very loading,
        // not when it is just keeping up with animation.
        if (rasterMapLayer._nLoadingRasters > 1) {
          rasterMapLayer.loading = true;
        }

        overlay.addOneTimeEventListener("load", function () {
          rasterMapLayer._nLoadingRasters--;
          var index = rasterMapLayer._imageOverlays.indexOf(overlay);
          rasterMapLayer._frameLookup[date] = index;
          if (rasterMapLayer._nLoadingRasters === 0) {
            rasterMapLayer.loading = false;
            $rootScope.$digest();
          }
        });
      };

    return rasterMapLayer;
  };

}]);
