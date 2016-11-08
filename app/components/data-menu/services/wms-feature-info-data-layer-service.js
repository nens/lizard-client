'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtDataLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
.factory('wmsFeatureInfoDataLayer', ['WmsGetFeatureInfoService', '$q',
  function (WmsGetFeatureInfoService, $q) {

    return function (options) {

      var wmsFeatureInfoDataLayer = options;

      wmsFeatureInfoDataLayer.type = 'wms';

      wmsFeatureInfoDataLayer.getData = function (options) {

        // WMS getFeatureInfo only supports points.
        if (options.geom.type !== 'Point') {
          var emptyPromise = $q.defer();
          emptyPromise.reject();
          return emptyPromise.promise;
        }

        return WmsGetFeatureInfoService
        .getData(wmsFeatureInfoDataLayer, options)
        .then(function (response) {
          // If it is not a featureCollection it will probably not render in the
          // omnibox. But who knows, it might be plain json with a data
          // attribute.
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
