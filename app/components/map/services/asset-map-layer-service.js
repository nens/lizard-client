'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('asset', ['$q', 'LeafletService', 'mapLayerService',
  function ($q, LeafletService, mapLayerService) {

    return function (options) {

      this.tms = mapLayerService.createTmsLayer(options);

      this.utf = mapLayerService.createUtfLayer(options);

      this.update = function (map, options) {
        var defer = $q.defer();

        this.tms.setOpacity(options.opacity);

        var tmsLoaded = true;
        var utfLoaded = true;
        if (!map.hasLayer(this.tms)) {
          tmsLoaded = false;
          map.addLayer(this.tms);
          this.tms.on('load', function () {
            tmsLoaded = true;
            if (tmsLoaded && utfLoaded) {
              defer.resolve();
            }
          });
        }
        if (!map.hasLayer(this.utf)) {
          utfLoaded = false;
          map.addLayer(this.utf);
          this.utf.on('load', function () {
            utfLoaded = true;
            if (utfLoaded && tmsLoaded) {
              defer.resolve();
            }
          });
        }

        return defer.promise;
      };

      this.remove = function (map) {
        if (map.hasLayer(this.tms)) {
          map.removeLayer(this.tms);
        }
        if (map.hasLayer(this.utf)) {
          map.removeLayer(this.utf);
        }
      };

    };

    }
  ]);
