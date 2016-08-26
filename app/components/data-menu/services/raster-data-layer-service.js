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

      var rasterDataLayer = options;

      rasterDataLayer.type = 'raster';

      rasterDataLayer.getData = function (options) {
        return RasterService.getData(_.merge(options, rasterDataLayer));
      };
      rasterDataLayer.getTimesteps = function (options) {
        return RasterService.getTimesteps(_.merge(options, rasterDataLayer));
      };

      return rasterDataLayer;

    };

  }

]);
