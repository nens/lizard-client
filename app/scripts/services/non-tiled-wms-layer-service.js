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

      function NxtWMSLayer(layer, temporalResolution) {
        NxtLayer.call(this, layer);

        Object.defineProperty(this, '_currentDate', {
          value: undefined,
          writable: true,
        });
        Object.defineProperty(this, '_imageOverlays', {
          value: {},
          writable: true,
        });
        Object.defineProperty(this, 'numCachedFrames', {
          value: 15,
          writable: false,
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
      }

      NxtWMSLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: NxtWMSLayer,

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
            var defer = $q.defer();
            var imageUrl;

            imageUrl = this._imageUrlBase +
              this.formatter(new Date(this._mkTimeStamp(this.timeState.at)));

            if (!this._imageOverlays[0]) {
              this._imageOverlays.push(LeafletService.imageOverlay());
            }

            this._imageOverlays[0]
              .setImageUrl(imageUrl)
              .setOpacity(this._opacity)
              .setBounds(this.imageBounds)
              .on('load', function () {
                defer.resolve();
              });

            addLeafletLayer(this._imageOverlays[0], map);

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
                this.BUFFER_LENGTH
              );
            }

            if (!currentOverlayIndex) {
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
          }
        },

        setOpacity: {
          value: function (opacity) {
            this._opacity = opacity;
            angular.forEach(this.frameLookup, function (key, frameIndex) {
              if (this.imageOverlays[frameIndex].getOpacity() !== 0) {
                this._imageOverlaysp[frameIndex].setOpacity(this._opacity);
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
            angular.forEach(this.frameLookup, function (key, frameIndex) {
              if (this.imageOverlays[frameIndex].getOpacity() !== 0) {
                var oldFrame = this.imageOverlays[frameIndex];
                // Delete the old overlay from the lookup, it is gone.
                delete this.frameLookup[key];
                this._animAddLoadListener(
                  oldFrame,
                  currentDate
                );

                oldFrame
                  .setOpacity(0)
                  .off('load')
                  .setUrl(this.imageUrlBase + this.formatter(new Date(currentDate)));
              }
            }, this);

            var newFrame = this._imageOverlays[currentOverlayIndex];
            // Turn on new frame
            newFrame.setOpacity(this._opacity);
          }
        },

        _fetchNewFrames: {
          value: function (currentDate, overlays, defer) {
            var nxtDate = currentDate;
            overlays.forEach(function (overlay) {
              overlay.setOpacity(0);
              overlay.off('load');
              this._addLoadListener(
                overlay,
                currentDate,
                defer
              );
              overlay.setUrl(
                this._imageUrlBase + this.formatter(new Date(nxtDate))
              );
              nxtDate += this.temporalResolution;
            }, this);
            return overlays;
          }
        },

        _animAddLoadListener: {
          value: function (overlay, date, defer) {
            this.nLoadingRasters++;

            overlay.on("load", function () {
              this.nLoadingRasters--;
              this.frameLookup[date] = String(this._imageOverlays.indexOf(overlay));
              if (defer && this.nLoadingRasters === 0) {
                defer.resolve();
              }
            });
          }
        }
      });


      var createImageOverlays = function (map, overlays, buffer) {
        for (var i = overlays.length - 1; i < buffer; i++) {
          overlays.push(
            addLeafletLayer(map, L.imageOverlay('', this.imageBounds))
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

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {object} nonLeafLayer as served from backend
       * @return {L.TileLayer.WMS}              [description]
       * @description Initiates a Leaflet WMS layer
       */
      var initializeWMSLayer = function (nonLeafLayer) {
        var _options = {
          layers: nonLeafLayer.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: nonLeafLayer.min_zoom || 0,
          maxZoom: 19,
          opacity: nonLeafLayer.opacity,
          zIndex: nonLeafLayer.zIndex
        };
        _options = angular.extend(_options, nonLeafLayer.options);

        return LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
      };
      return NxtWMSLayer;
    }
  ]);
