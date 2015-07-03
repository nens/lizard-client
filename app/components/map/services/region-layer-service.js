'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('NxtRegionsLayer', [
  'MapService',
  'CabinetService',
  'LeafletService',
  function (MapService, CabinetService, LeafletService) {

    var regionsLayer;

    var l;

    var addRegions = function (z, bounds, clickCb) {
      CabinetService.regions.get({
        z: z,
        in_bbox: bounds.getWest()
          + ','
          + bounds.getNorth()
          + ','
          + bounds.getEast()
          + ','
          + bounds.getSouth()
      }).then(function (regions) {
        MapService.removeLeafletLayer(regionsLayer);
        regionsLayer = LeafletService.geoJson(regions.results, {
          style: function (feature) {
            return {
                // fillColor: 'blue',
                // weight: 2,
                // opacity: 1,
                // color: 'white',
                // dashArray: '3',
                // fillOpacity: 0.7
            };
          },
          onEachFeature: function (d, layer) {
            layer.on('mouseover', function (e) {
            });
            layer.on('mouseout', function (e) {
            });
            layer.on('click', function (e) {
              if (l) {
                regionsLayer.resetStyle(l);
              }
              l = e.target;
              l.setStyle({
                  weight: 5,
                  color: 'red',
                  dashArray: '',
                  fillOpacity: 0.7
              });
              clickCb(this);
            });
          }
        });
        MapService.addLeafletLayer(regionsLayer);
      });
    };

    return {
      add: addRegions,
      remove: function () { MapService.removeLeafletLayer(regionsLayer); }
    };

  }]
);
