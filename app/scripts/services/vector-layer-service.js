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

        getData: {
          value: function (lgSlug, options, deferred) {
            return this._buildPromise(lgSlug, options, deferred, VectorService);
          }
        },

        syncTime: {
          value: function (mapState, timeState, oldTime) {
            this._leafletLayer.redraw(this, mapState, timeState);
            return;
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

      var initializeVectorLayer = function (nonLeafLayer) {
        var leafletLayer;

        if (nonLeafLayer.tiled) {
          // Initiate a tiled Vector layer
          var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

          leafletLayer = new LeafletVectorService(url, {
            minZoom: nonLeafLayer.min_zoom,
            maxZoom: nonLeafLayer.max_zoom,
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
