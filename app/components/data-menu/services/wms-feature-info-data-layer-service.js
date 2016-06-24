'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtDataLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
.factory('wmsFeatureInfoDataLayer', ['WmsGetFeatureInfoService',
  function (WmsGetFeatureInfoService) {

    return function (options) {

      var wmsFeatureInfoDataLayer = {};

      wmsFeatureInfoDataLayer.uuid = options.uuid;

      wmsFeatureInfoDataLayer.type = 'raster';

      wmsFeatureInfoDataLayer.getData = function (options) {
        return WmsGetFeatureInfoService.getData(_.merge(wmsFeatureInfoDataLayer, options));
      };

      return wmsFeatureInfoDataLayer;

    };

  }

]);
