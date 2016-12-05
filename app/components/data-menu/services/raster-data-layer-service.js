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
    // TODO: so this is a layer data service. I really get why this is in the
    // data-menu. Rasterdata is a map thing. Except that it isn't always. This
    // is also an interface to timeseries and probably to some other things
    // that I can't think about just yet.
    // But this also illustrates why I probably shouldn't decide about the
    // client-implementation. This is what I meant when I said I think from a
    // data standpoint. To me the data is at the center and the client
    // visualizes the data. The way the client is set up it is the other way
    // around. You code the client and its parts and you put the relevant data
    // service where it is needed most.
    // I do see a problem there though. This means you limit yourself to the
    // specific implementation layout that seems logical at some point in time.
    // Changing it becomes hard (and when it is changed it becomes a danger
    // that you leave in some rudimentary design choices).
    // One example is the specific rain data implementation even if rasters
    // were in place.

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
