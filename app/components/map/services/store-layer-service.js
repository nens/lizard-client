'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('lizard-nxt')
  .factory('StoreLayer', ['NxtLayer', 'LeafletService', 'RasterService',
  function (NxtLayer, LeafletService, RasterService) {

      function StoreLayer(layer) {
        NxtLayer.call(this, layer);
      }

      StoreLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: StoreLayer,

        getData: {
          value: function (lgSlug, options, deferred) {
            if (options.type && options.type !== this.type) { return; }
            return this._buildPromise(lgSlug, options, deferred, RasterService);
          }
        }

      });

      return StoreLayer;

    }
  ]);
