'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('baselayer', ['LeafletService', 'MapLayerService',
  function (LeafletService, MapLayerService) {

    return function (options) {

      var baselayer = {};

      var tms = MapLayerService.createTmsLayer(options);

      baselayer.id = options.id;
      baselayer.type = 'baselayer';

      baselayer.update = function (map, options) {
        if (!map.hasLayer(tms)) {
          map.addLayer(tms);
        }
      };

      baselayer.remove = function (map) {
        if (map.hasLayer(tms)) {
          map.removeLayer(tms);
        }
      };

      return baselayer;

    };

  }
]);
