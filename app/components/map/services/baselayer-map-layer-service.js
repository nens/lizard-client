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

      baselayer.uuid = options.uuid;

      baselayer.update = function (map, timeState, options) {
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
