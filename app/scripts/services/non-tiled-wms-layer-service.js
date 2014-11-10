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
        // imgUrlBase equals full URL w/o TIME part
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

            if (!this._timeState) {
              imageUrl = this._imageUrlBase.split('&TIME=')[0];
            }
            else {
              imageUrl = this._imageUrlBase +
                this.formatter(new Date(this._mkTimeStamp(this._timeState.at)));
            }

            if (!this._imageOverlays[0]) {
              this._imageOverlays.push(LeafletService.imageOverlay(
                imageUrl,
                this.imageBounds,
                { opacity: 1 }
                )
              );
            }

            this._imageOverlays[0].on('load', function () {
              defer.resolve();
            });

            this._imageOverlays[0].addTo(map);

            return defer.promise;
          }
        },

        syncTime: {
          value: function (mapState, timeState) {
            var defer = $q.defer();
            var currentDate = this._mkTimeStamp(timeState.at),
                overlayIndex = this._frameLookup[currentDate];

            if (this._imageOverlays.length < 1) {
              // This is the first and only time we come here
              this._imageOverlays = RasterService.getImgOverlays(
                this.numCachedFrames,
                this.imageBounds
              );

              for (var i in this._imageOverlays) {
                mapState._map.addLayer(this._imageOverlays[i]);
                this.nLoadingRasters++;
                this._imageOverlays.imageOverlays[i].setOpacity(0);
                this._imageOverlays.imageOverlays[i].off('load');
                this._animAddLoadListener(s.imageOverlays[i], i, s.nxtDate, timeState);
                this._imageOverlays.imageOverlays[i].setUrl(
                  this._imageUrlBase + s.utcFormatter(new Date(s.nxtDate))
                );
                s.nxtDate += s.step;
              }

              this._imageOverlays[0].setOpacity(this._opacity);
            }

            if (!overlayIndex) {}

            if () {}




            // for (var i in this._imageOverlays) {
            //   var a = map.addLayer(this._imageOverlays[i]);
            //   console.log(a);
            // }
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

      });

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
