'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('wmsMapLayer', [
  '$q',
  'LeafletService',
  'MapLayerService',
  'RasterService',
  function ($q, LeafletService, MapLayerService, RasterService) {

    return function (options) {

      var wmsMapLayer = options;

      var params = RasterService.getWmsParameters(
        wmsMapLayer.complexWmsOptions,
        0,
        0
      );

      wmsMapLayer.wms = MapLayerService.createWmsLayer(
        _.extend(options, params)
      );

      wmsMapLayer.update = function (map, timeState, options) {
        var promise;

        wmsMapLayer.wms.setOpacity(options.opacity);

        var params = RasterService.getWmsParameters(
          wmsMapLayer.complexWmsOptions,
          map.getZoom(),
          timeState.aggWindow
        );

        if (!map.hasLayer(wmsMapLayer.wms)) {
          map.addLayer(wmsMapLayer.wms);
        }

        wmsMapLayer.wms.setParams(params);

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
