'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('assetMapLayer', ['$q', 'LeafletService', 'MapLayerService',
  function ($q, LeafletService, MapLayerService) {

    return function (options) {

      var assetMapLayer = {};

      assetMapLayer.uuid = options.uuid;

      options.zIndex = 9999;

      assetMapLayer.tms = MapLayerService.createTmsLayer(options);

      assetMapLayer.utf = MapLayerService.createUtfLayer(options);

      assetMapLayer.update = function (map, timeState, options) {
        var defer = $q.defer();

        assetMapLayer.tms.setOpacity(options.opacity);

        var tmsLoaded = true;
        var utfLoaded = true;
        if (!map.hasLayer(assetMapLayer.tms)) {
          tmsLoaded = false;
          map.addLayer(assetMapLayer.tms);
          assetMapLayer.tms.on('load', function () {
            tmsLoaded = true;
            if (tmsLoaded && utfLoaded) {
              defer.resolve();
            }
          });
        }
        if (!map.hasLayer(assetMapLayer.utf)) {
          utfLoaded = false;
          map.addLayer(assetMapLayer.utf);
          assetMapLayer.utf.on('load', function () {
            utfLoaded = true;
            if (utfLoaded && tmsLoaded) {
              defer.resolve();
            }
          });
        }

        return defer.promise;
      };

      assetMapLayer.remove = function (map) {
        if (map.hasLayer(assetMapLayer.tms)) {
          map.removeLayer(assetMapLayer.tms);
        }
        if (map.hasLayer(assetMapLayer.utf)) {
          map.removeLayer(assetMapLayer.utf);
        }
      };

      return assetMapLayer;
    };

    }
  ]);
