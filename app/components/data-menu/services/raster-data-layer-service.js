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

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer can return data (Store and vector).
        * @param  {string} callee string of the callee to keep requests
        *                         seperate.
        * @param lgSlug slug of the layer.
        * @param options options object with geom and time.
        * @param deferred the defer to resolve when getting data.
        */
      rasterDataLayer.getData = function (options) {


      };

      return rasterDataLayer;

    };

  }

]);
