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

      var wmsMapLayer = {};

      wmsMapLayer.uuid = options.uuid;

      wmsMapLayer.type = 'raster';

      wmsMapLayer.update = function (map, timeState, options) {
        var promise;

        wmsMapLayer.wms.setOpacity(options.opacity);

        if (!map.hasLayer(wmsMapLayer.wms)) {
        }

        return promise;
      };


      /**
       * @description removes all _imageOverlays from the map. Removes
       *              listeners from the _imageOverlays, the _imageOverlays
       *              from this layer and removes the references to
       *              the _imageOverlays.
       */
      wmsMapLayer.remove = function (map) {
        if (map.hasLayer(wmsMapLayer.cml)) {
          map.removeLayer(wmsMapLayer.cml);
        }
      };

    return wmsMapLayer;
  };

}]);
