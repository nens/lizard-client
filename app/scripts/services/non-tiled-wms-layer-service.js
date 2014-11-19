'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('lizard-nxt')
  .factory('NxtNonTiledWMSLayer', ['NxtLayer', 'LeafletService', 'RasterService', 'UtilService', '$http', '$q',
  function (NxtLayer, LeafletService, RasterService, UtilService, $http, $q) {

      function NxtNonTiledWMSLayer(layer, temporalResolution) {
        NxtLayer.call(this, layer);

        Object.defineProperty(this, '_imageOverlays', {
          value: {},
          writable: true,
        });
        Object.defineProperty(this, 'temporalResolution', {
          value: temporalResolution,
          writable: false,
        });
        Object.defineProperty(this, '_imageOverlays', {
          value: [],
          writable: true,
        });
        Object.defineProperty(this, '_imageUrlBase', {
          value: RasterService.buildURLforWMS(this),
          writable: true,
        });
        Object.defineProperty(this, 'formatter', {
          value: d3.time.format.utc("%Y-%m-%dT%H:%M:%S"),
          writable: true,
        });
        Object.defineProperty(this, '_frameLookup', {
          value: {},
          writable: true,
        });
        Object.defineProperty(this, 'BUFFER_LENGTH', {
          value: 10,
          writable: false,
        });
        Object.defineProperty(this, 'imageBounds', {
          value: {},
          writable: true,
        });
        Object.defineProperty(this, '_nLoadingRasters', {
          value: 0,
          writable: true,
        });
      }

      NxtNonTiledWMSLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: NxtNonTiledWMSLayer,

        initializeLayer: {
          value: function () {

            var southWest = L.latLng(
              this.bounds.south,
              this.bounds.west
            ),
            northEast = L.latLng(
              this.bounds.north,
              this.bounds.east
            );
            this.imageBounds = L.latLngBounds(southWest, northEast);
          }
        },

        add: {
          value: function (map) {
            var defer = $q.defer(),
                imageUrl = '',
                opacity = this._opacity,
                date = new Date(this._mkTimeStamp(this.timeState.at));

            imageUrl = this._imageUrlBase +
              this.formatter(new Date(this._mkTimeStamp(this.timeState.at)));

            this._imageOverlays = [
              LeafletService.imageOverlay(
                imageUrl,
                this.imageBounds,
                {opacity: opacity}
              )
            ];

            var layer = this._imageOverlays[0].addTo(map);

            this._addLoadListener(layer, this.timeState.at, defer);

            return defer.promise;
          }
        },

        syncTime: {
          value: function (timeState, map) {
            this.timeState = timeState;
            var defer = $q.defer();
            var currentDate = this._mkTimeStamp(timeState.at),
                currentOverlayIndex = this._frameLookup[currentDate];
            if (this._imageOverlays.length < this.BUFFER_LENGTH) {
              // add leaflet layers to fill up the buffer
              this._imageOverlay = createImageOverlays(
                map,
                this._imageOverlays,
                this.imageBounds,
                this.BUFFER_LENGTH
              );
            }

            if (currentOverlayIndex === undefined) {
              // Ran out of buffered frames
              this._imageOverlays = this._fetchNewFrames(
                currentDate,
                this._imageOverlays,
                defer,
                this._imageUrlBase,
                this.formatter
              );
            }

            else {
              this._progressFrame(currentDate, currentOverlayIndex);
              // Done!
              defer.resolve();
            }

            return defer.promise;
          }
        },

        remove: {
          value: function (map) {
            for (var i in this._imageOverlays) {
              if (map.hasLayer(this._imageOverlays[i])) {
                map.removeLayer(this._imageOverlays[i]);
              }
            }
            this._imageOverlays = [];
            this._frameLookup = {};
          }
        },

        setOpacity: {
          value: function (opacity) {
            this._opacity = opacity;
            angular.forEach(this._frameLookup, function (frameIndex) {
              if (this._imageOverlays[frameIndex].options.opacity !== 0) {
                this._imageOverlays[frameIndex].setOpacity(this._opacity);
              }
            }, this);
            return;
          }
        },

        /**
         * Local helper that returns a rounded timestamp
         */
        _mkTimeStamp: {
          value: function (t) {
            return UtilService.roundTimestamp(t, this.temporalResolution, false);
          }
        },

        _progressFrame : {
          value: function (currentDate, currentOverlayIndex) {
            angular.forEach(this._frameLookup, function (frameIndex, key) {
              if (this._imageOverlays[frameIndex].options.opacity !== 0
                && frameIndex !== currentOverlayIndex) {
                var oldFrame = this._imageOverlays[frameIndex];

                // Delete the old overlay from the lookup, it is gone.
                delete this._frameLookup[key];
                this._addLoadListener(
                  oldFrame,
                  this._nxtDate
                );

                oldFrame
                  .setOpacity(0)
                  .off('load')
                  .setUrl(this._imageUrlBase + this.formatter(new Date(this._nxtDate)));

                this._addLoadListener(oldFrame, this._nxtDate);

                this._nxtDate += this.temporalResolution;
              }
            }, this);

            var newFrame = this._imageOverlays[currentOverlayIndex];
            // Turn on new frame
            newFrame.setOpacity(this._opacity);
          }
        },

        _fetchNewFrames: {
          value: function (currentDate, overlays, defer) {
            this._nxtDate = currentDate;
            this._frameLookup = {};
            this._nLoadingRasters = 0;

            angular.forEach(overlays, function (overlay) {
              var url = this._imageUrlBase + this.formatter(new Date(this._nxtDate));
              overlay.setOpacity(0);
              if (url !== overlay._url) {
                overlay.off('load');
                this._addLoadListener(
                  overlay,
                  this._nxtDate,
                  defer
                );
                overlay.setUrl(url);
              }

              else {
                this._frameLookup[this._nxtDate] = this._imageOverlays.indexOf(overlay);
                if (this._imageOverlays.indexOf(overlay) === 0) {
                  this._imageOverlays[0].setOpacity(this._opacity);
                }
              }

              this._nxtDate += this.temporalResolution;
            }, this);
            return overlays;
          }
        },

        _addLoadListener: {
          value: function (overlay, date, defer) {
            this._nLoadingRasters++;

            overlay.on("load", function () {
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
        }
      });


      var createImageOverlays = function (map, overlays, bounds, buffer) {
        for (var i = overlays.length - 1; i < buffer; i++) {
          overlays.push(
            addLeafletLayer(map, L.imageOverlay('', bounds))
          );
        }
      };

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

      return NxtNonTiledWMSLayer;
    }
  ]);
