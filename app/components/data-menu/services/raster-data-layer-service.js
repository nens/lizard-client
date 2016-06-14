'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtDataLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
.factory('rasterDataLayer', ['RasterService',
  function (RasterService) {

    return function (options) {

      var rasterDataLayer = {};

      rasterDataLayer.uuid = options.uuid;

      rasterDataLayer.type = 'raster';

      rasterDataLayer.getData = function (options) {
        return RasterService.getData(_.merge(rasterDataLayer, options));
      };

      return rasterDataLayer;

    };

  }

]);
