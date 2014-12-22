'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('lizard-nxt')
  .factory('NxtVectorLayer', ['$q', 'NxtLayer',
      'LeafletVectorService', 'VectorService',
  function ($q, NxtLayer, LeafletVectorService, VectorService) {

      function NxtVectorLayer(layer) {
        NxtLayer.call(this, layer);

        Object.defineProperty(this, '_leafletLayer', {
          value: undefined,
          writable: true,
        });
      }

      NxtVectorLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: NxtVectorLayer,

        initializeLayer: {
          value: function () {
            this._leafletLayer = initializeVectorLayer(this);
          }
        },

        add: {
          value: function (map) {
            var defer = $q.defer();
            if (this._leafletLayer) {
              this._addLeafletLayer(map, this._leafletLayer);
              this._leafletLayer.on('load', function () {
                defer.resolve();
              });
            }
            else {
              defer.resolve();
            }
            return defer.promise;
          }
        },

        remove: {
          value: function (map) {
            if (this._leafletLayer) {
              this._removeLeafletLayer(map, this._leafletLayer);
            }
          }
        },

        getData: {
          value: function (lgSlug, options, deferred) {
            if (options.type && options.type !== this.type) { return; }
            return this._buildPromise(lgSlug, options, deferred, VectorService);
          }
        },

        syncTime: {
          value: function (timeState, map) {
            var defer = $q.defer();
            if (timeState.playing) {
              this._leafletLayer.syncTime(this, {
                start: timeState.at,
                end: timeState.at + timeState.aggWindow
              });
            } else {
              this._leafletLayer.syncTime(this, timeState);
            }
            defer.resolve();
            return defer.promise;
          }
        },
        setOpacity: {
          value: function (opacity) {
            if (this._leafletLayer && this._leafletLayer.setOpacity) {
              this._leafletLayer.setOpacity(opacity);
            }
          }
        },

      });

      var initializeVectorLayer = function (nonLeafLayer) {
        var leafletLayer;

        if (nonLeafLayer.tiled) {
          // Initiate a tiled Vector layer
          var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

          leafletLayer = new LeafletVectorService(url, {
            minZoom: nonLeafLayer.minZoom,
            maxZoom: nonLeafLayer.maxZoom,
            color: nonLeafLayer.color,
            slug: nonLeafLayer.slug,
            ext: 'geojson'
          });

        } else {
          // throw new Error('Initiate (non-tiled) Vector layer, for e.g. events');
          return leafletLayer;
        }
        return leafletLayer;
      };

      return NxtVectorLayer;

    }
  ]);
