'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 *
 * Non tiled wms layers use a bounding box to make request to a wms for one tile
 * which is displayed as a leaflet image overlay. Nxt-non-tiled-wms-layer is
 * used to create a wms layer that is animatable. When synced to time, it builds
 * a buffer of images, fills the buffer with new images or turns one of the
 * images from the buffer on and start loading a new image in the place of the
 * previous.
 *
 * Usage: add animation functionality to an instance NxtLayer by using
 * NxtNonTiledWMSLayer.create(<layer>);
 *
 */
angular.module('map')
.factory('NxtNonTiledWMSLayer', [
  'NxtLayer',
  'LeafletService',
  'RasterService',
  'UtilService',
  '$http',
  '$q',
  function (NxtLayer, LeafletService, RasterService, UtilService, $http, $q) {

      /**
       * @function
       * @memberof app.LayerGroup
       * @param {L.Class} Leaflet layer.
       * @description Adds layer to map
       */
      var addLeafletLayer = function (map, leafletLayer) { // Leaflet NxtLayer
        if (map.hasLayer(leafletLayer)) {
          throw new Error(
            'Attempted to add layer' + leafletLayer._id
            + 'while it was already part of the map'
          );
        } else {
          map.addLayer(leafletLayer);
        }
        return leafletLayer;
      };

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {L.Class} Leaflet map
       * @param  {L.Class} Leaflet layer
       * @description Removes layer from map
       */
      var removeLeafletLayer = function (map, leafletLayer) { // Leaflet NxtLayer
        if (map.hasLayer(leafletLayer)) {
          map.removeLayer(leafletLayer);
        } else {
          throw new Error(
            'Attempted to remove layer' + leafletLayer._id
            + 'while it was NOT part of provided the map'
          );
        }
      };

      return {
        create: function (layer) {

          // Array of imageoverlays used as buffer.
          Object.defineProperty(layer, '_imageOverlays', {
            value: [],
            writable: true,
          });
          // Formatter used to format a data object.
          Object.defineProperty(layer, '_formatter', {
            value: d3.time.format.utc("%Y-%m-%dT%H:%M:%S"),
            writable: true,
          });
          // Base of the image url without the time.
          Object.defineProperty(layer, '_imageUrlBase', {
            value: '',
            writable: true,
          });
          // Lookup to store which data correspond to which imageOverlay.
          Object.defineProperty(layer, '_frameLookup', {
            value: {},
            writable: true,
          });
          // Length of the buffer, set in the initialization. Ideally the buffer
          // is small to get up to speed fast, for slow connections or high
          // frequent images it should be large. When having a very sparse
          // resolution, animation will also move slowly, so there is no need
          // for a big buffer.
          Object.defineProperty(layer, '_bufferLength', {
            value: layer._temporalResolution >= 3600000 ? 2 : 6,
            writable: true,
          });
          // Number of rasters currently underway.
          Object.defineProperty(layer, '_nLoadingRasters', {
            value: 0,
            writable: true,
          });

          angular.extend(layer, {

            /**
             * @description Adds one imageOverlay with the current time to the map.
             * @return a promise that resolves when the image has loaded. Usefull
             *         for sequential loading of layers.
             */
            add: function (map, optionalDefer) {

              var defer = optionalDefer || $q.defer(),
                  opacity = this._opacity,
                  date = new Date(this._mkTimeStamp(this.timeState.at)),
                  store = this._determineStore(this.timeState);

              var options = {
                layers: store.name,
                format: 'image/png',
                version: '1.1.1',
                minZoom: layer.min_zoom || 0,
                maxZoom: 19,
                opacity: layer.opacity,
                zIndex: layer.zIndex,
                crs: LeafletService.CRS.EPSG3857,
                time: this._formatter(date)
              };

              options = angular.extend(options, layer.options);

              // This breaks styles with negative values
              // and for the moment only applies to radar.
              if (this.slug.split('/')[0] === 'radar') {
                this.options.styles = this.options.styles.split('-')[0]
                  + '-'
                  + store.name.split('/')[1];
              }

              this._imageOverlays = [
                LeafletService.tileLayer.wms(layer.url, options)
              ];

              // defer is passed to loadlistener to be resolved when done.
              this._addLoadListener(
                this._imageOverlays[0].addTo(map),
                this.timeState.at,
                defer
              );

              return defer.promise;
            },

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
            syncTime: function (timeState, map) {
              var defer = $q.defer();

              // Resolve and return when nothing changed.
              if (timeState.at === this.timeState.at
                && timeState.aggWindow === this.timeState.aggWindow
                && timeState.playing === this.timeState.playing) {
                defer.resolve();
                return defer.promise;
              }

              // Store copy no reference.
              this.timeState = angular.copy(timeState);

              // this only works for stores with different aggregation levels
              // for now this is only for the radar stores
              // change image url based on timestate.
              var store = this._determineStore(timeState);
              this._temporalResolution = store.resolution;
              this._imageUrlBase = RasterService.buildURLforWMS(
                this,
                map,
                store.name,
                timeState.playing
              );

              this._temporalResolution = store.resolution;

              // This breaks styles with negative values
              // and for the moment only applies to radar.
              if (this.slug.split('/')[0] === 'radar') {
                this.options.styles = this.options.styles.split('-')[0]
                  + '-'
                  + store.name.split('/')[1];
              }

              this._syncToNewTime(timeState, map, defer);

              return defer.promise;
            },

            /**
             * @description removes all _imageOverlays from the map. Removes
             *              listeners from the _imageOverlays, the _imageOverlays
             *              from this layer and removes the references to
             *              the _imageOverlays.
             */
            remove: function (map) {
              for (var i in this._imageOverlays) {
                if (map.hasLayer(this._imageOverlays[i])) {
                  this._imageOverlays[i].off('load');
                  map.removeLayer(this._imageOverlays[i]);
                }
              }
              this._nLoadingRasters = 0;
              this._imageOverlays = [];
              this._frameLookup = {};
            },

            /**
             * @description sets the provided opacity to the layer and all the
             *              _imageOverlays that have an opacity other than 0. Sets
             *              the opacity to nearly 0 when the provided opacity is
             *              exactly 0 in order to distinguish layers that are off
             *              and layers that have are transparant.
             */
            setOpacity: function (opacity) {
              if (opacity === 0) { opacity = 0.1; }
              this._opacity = opacity;
              angular.forEach(this._frameLookup, function (frameIndex) {
                if (this._imageOverlays[frameIndex].options.opacity !== 0) {
                  this._imageOverlays[frameIndex].setOpacity(this._opacity);
                }
              }, this);
              return;
            },

            /**
             * Takes a new timeState and delegates to sync functions for
             * animation or non-animation.
             * @param  {object} map         leaflet map
             * @param  {int}    currentDate ms from epoch
             * @param  {object} defer       defer to resolve when done
             */
            _syncToNewTime: function (timeState, map, defer) {
              var currentDate = this._mkTimeStamp(timeState.at);
              if (timeState.playing) {
                this._animateSyncTime(map, currentDate, defer);
              }
              else {
                this._tiledSyncTime(map, currentDate, defer);
              }
            },

            /**
             * syncToTime with a tiled layer. Simpy removes everything and uses
             * add method to create a new tiled layer
             * @param  {object} map         leaflet map
             * @param  {int}    currentDate ms from epoch
             * @param  {object} defer       defer to resolve when done
             */
            _tiledSyncTime: function (map, currentDate, defer) {
              this.remove(map);
              this.add(map, defer);
            },

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
            _animateSyncTime: function (map, currentDate, defer) {
              var newBounds = map.getBounds();

              if (this._imageOverlays.length < this._bufferLength
                || newBounds.getNorth() !== this._bounds.getNorth()
                || newBounds.getWest() !== this._bounds.getWest()) {
                // add leaflet layers to fill up the buffer
                this._imageOverlays = this._createImageOverlays(
                  map,
                  this._bufferLength
                );
              }

              var currentOverlayIndex = this._frameLookup[currentDate];

              if (currentOverlayIndex === undefined) {
                // Ran out of buffered frames
                this._imageOverlays = this._fetchNewFrames(
                  currentDate,
                  this._imageOverlays,
                  defer
                );
              }

              else {
                this._progressFrame(currentOverlayIndex);
                // Done!
                defer.resolve();
              }

            },

            /**
             * @description Adds new imageoverlays.
             * @param  {L.Map} map.
             * @param  {overlays} overlays current overlays to add to.
             * @param  {bounds} bounds   bounds of overlays.
             * @param  {int} buffer   amount of imageOverlays to include.
             * @return {array} array of L.imageOverlays.
             */
            _createImageOverlays: function (map, buffer) {
              // detach all listeners and references to the imageOverlays.
              this.remove(map);
              // create new ones.
              for (var i = this._imageOverlays.length; i < buffer; i++) {
                this._imageOverlays.push(
                  addLeafletLayer(map, LeafletService.imageOverlay('', map.getBounds()))
                );
              }
              this._bounds = angular.copy(map.getBounds());
              return this._imageOverlays;
            },


            /**
             * Local helper that returns a rounded timestamp
             */
            _mkTimeStamp: function (t) {
              var result = UtilService.roundTimestamp(t, this._temporalResolution, false);
              return result;
            },

            /**
             * @description based on the temporal window. The time between
             * timestate.start and timestate.end determines which store is to be used.
             * This only works for radar stuff.
             *
             */
            _determineStore: function (timeState) {

              if (this.slug.split('/')[0] !== 'radar') {
                return {
                  name: layer.slug,
                  resolution: layer._temporalResolution
                };
              }

              var resolutionHours = (timeState.aggWindow) / 60 / 60 / 1000;

              var aggType = this.slug.split('/');

              if (resolutionHours >= 24) {
                aggType[1] = 'day';
              } else if (resolutionHours >= 1 && resolutionHours < 24) {
                aggType[1] = 'hour';
              } else {
                aggType[1] = '5min';
              }
              var resolutions = {
                '5min': 300000,
                'hour': 3600000,
                'day': 86400000
              };

              return {
                name: aggType.join('/'),
                resolution: resolutions[aggType[1]]
              };

            },


            /**
             * @description Removes old frame by looking for a frame that has an
             *              opacity that is not 0 and setting it to 0, deleting it
             *              from the lookup and replacing the image source. NewFrame
             *              is turned on by setting opacity to _opacity.
             * @param {int} currentOverlayIndex index of the overlay in
             *              _imageOverlays.
             */
            _progressFrame: function (currentOverlayIndex) {
              angular.forEach(this._frameLookup, function (frameIndex, key) {

                if (this._imageOverlays[frameIndex].options.opacity !== 0
                  && frameIndex !== currentOverlayIndex) {
                  // Delete the old overlay from the lookup, it is gone.
                  delete this._frameLookup[key];
                  this._replaceUrlFromFrame(frameIndex);
                }
              }, this);

              var newFrame = this._imageOverlays[currentOverlayIndex];
              // Turn on new frame
              newFrame.setOpacity(this._opacity);
            },

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
            _replaceUrlFromFrame: function (frameIndex, defer) {
              var url = this._imageUrlBase + this._formatter(new Date(this._nxtDate));
              var frame = this._imageOverlays[frameIndex];
              frame.off('load');
              frame.setOpacity(0);
              if (url !== frame._url) {
                this._addLoadListener(frame, this._nxtDate, defer);
                frame.setUrl(url);
              }
              else {
                var index = this._imageOverlays.indexOf(frame);
                this._frameLookup[this._nxtDate] = index;
                if (index === 0) {
                  this._imageOverlays[0].setOpacity(this._opacity);
                }
              }
              this._nxtDate += this._temporalResolution;
            },

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
            _fetchNewFrames: function (currentDate, overlays, defer) {
              this._nxtDate = currentDate;
              this._frameLookup = {};
              this._nLoadingRasters = 0;

              angular.forEach(overlays, function (overlay, i) {
                this._replaceUrlFromFrame(i, defer);
              }, this);

              return overlays;
            },

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
            _addLoadListener: function (overlay, date, defer) {
              this._nLoadingRasters++;
              overlay.addOneTimeEventListener("load", function () {
                this._nLoadingRasters--;
                var index = this._imageOverlays.indexOf(overlay);
                this._frameLookup[date] = index;
                if (defer && index === 0) {
                  this._imageOverlays[0].setOpacity(this._opacity);
                }
                if (defer && this._nLoadingRasters === 0) {
                  defer.resolve();
                }
              }, this);
            }
          });

          return layer;

        }

      };

    }
  ]);
