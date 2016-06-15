'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('wmsMapLayer', ['$q', 'LeafletService', 'MapLayerService',
  function ($q, LeafletService, MapLayerService) {

    return function (options) {

      var wmsMapLayer = options.wmsOptions;

      wmsMapLayer.url = options.url;

      wmsMapLayer.type = 'raster';

      wmsMapLayer.wms = MapLayerService.createWmsLayer(options);

      wmsMapLayer.update = function (map, timeState, options) {
        var promise;

        wmsMapLayer.wms.setOpacity(options.opacity);

        if (!map.hasLayer(wmsMapLayer.wms)) {
          map.addLayer(wmsMapLayer.wms);
        }

        return promise;
      };

      wmsMapLayer.remove = function (map) {
        if (map.hasLayer(wmsMapLayer.wms)) {
          map.removeLayer(wmsMapLayer.wms);
        }
      };

    return wmsMapLayer;
  };

}]);
