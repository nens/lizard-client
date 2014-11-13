'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Laye
r * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('lizard-nxt')
  .factory('NxtUTFLayer', ['NxtLayer', 'LeafletService', 'UtfGridService', '$q',
  function (NxtLayer, LeafletService, UtfGridService, $q) {

      function NxtUTFLayer(layer) {
        NxtLayer.call(this, layer);

        Object.defineProperty(this, '_leafletLayer', {
          value: undefined,
          writable: true,
        });
      }

      NxtUTFLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: NxtUTFLayer,

        initializeLayer: {
          value: function () {
            this._leafletLayer = initializeGridLayer(this);
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
            return this._buildPromise(lgSlug, options, deferred, UtfGridService);
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
            'Attempted to add layer ' + leafletLayer._id
            + ' while it was already part of the map'
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
            'Attempted to remove layer ' + leafletLayer._id
            + ' while it was NOT part of provided the map'
          );
        }
      };

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {object} nonLeafLayer as served from backend
       * @return {L.UtfGrid} utfgrid
       * @description Initiates layers that deliver interaction with the map
       */
      var initializeGridLayer = function (nonLeafLayer) {

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        var layer = new LeafletService.UtfGrid(url, {
          ext: 'grid',
          slug: nonLeafLayer.slug,
          name: nonLeafLayer.slug,
          useJsonP: false,
          minZoom: nonLeafLayer.min_zoom_click || 0,
          maxZoom: 19,
          order: nonLeafLayer.zIndex,
          zIndex: nonLeafLayer.zIndex
        });
        return layer;
      };

      return NxtUTFLayer;

    }
  ]);
