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

      var wmsFeatureInfoDataLayer = options;

      wmsFeatureInfoDataLayer.type = 'wms';

      wmsFeatureInfoDataLayer.getData = function (options) {
        return WmsGetFeatureInfoService
        .getData(wmsFeatureInfoDataLayer, options)
        .then(function (response) {
          if (response.type === 'FeatureCollection') {
            response.data = response.features;
            response.type = wmsFeatureInfoDataLayer.type;
          }
          return response;
        });
      };

      return wmsFeatureInfoDataLayer;

    };

  }

]);
