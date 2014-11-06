'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Laye
r * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('lizard-nxt')
  .factory('NxtTMSLayer', ['NxtLayer', 'LeafletService', '$http', '$q',
  function (NxtLayer, LeafletService, $http, $q) {

      function NxtTMSLayer(layer) {
        NxtLayer.call(this, layer);
        Object.defineProperty(this, '_leafletLayer', {
          value: undefined,
          writable: true,
        });
      }

      NxtTMSLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: NxtTMSLayer,

        initializeLayer: {
          value: function () {
            this._leafletLayer = initializeTMSLayer(this);
          }
        },

        add: {
          value: function (map) {
            var defer = $q.defer();
            if (this._leafletLayer) {
              addLeafletLayer(map, this._leafletLayer);
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
              removeLeafletLayer(map, this._leafletLayer);
            }
          }
        },

        /**
         * @function
         * @description rescales layer and updates url
         */
        rescale: {
          value: function (bounds) {
            if (this.rescalable) {
              var url = this.url +
                '?request=getlimits&layers=' + this.slug +
                '&width=16&height=16&srs=epsg:4326&bbox=' +
                bounds.toBBoxString();
              var self = this;
              $http.get(url).success(function (data) {
                self.limits = ':' + data[0][0] + ':' + data[0][1];
                self._leafletLayer.setParams({
                  styles: self.options.styles + self.limits
                });
                self._leafletLayer.redraw();
              });
            }
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
       * @param  {object} layer as served from backend
       * @return {L.TileLayer} leafletLayer
       * @description Initiates a Leaflet Tilelayer
       */
      var initializeTMSLayer = function (nonLeafLayer) {

        var layerUrl = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';
        var layer = LeafletService.tileLayer(
          layerUrl, {
            slug: nonLeafLayer.slug,
            minZoom: nonLeafLayer.min_zoom || 0,
            maxZoom: 19,
            detectRetina: true,
            zIndex: nonLeafLayer.zIndex,
            ext: 'png'
          });

        return layer;
      };

      return NxtTMSLayer;

    }
  ]);
