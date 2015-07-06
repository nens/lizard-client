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

    var previousActiveLayer;

    var activeRegionString;

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
              if (previousActiveLayer) {
                regionsLayer.resetStyle(previousActiveLayer);
              }
              var newActiveLayer = e.target;
              newActiveLayer.setStyle({
                  weight: 5,
                  color: 'red',
                  dashArray: '',
                  fillOpacity: 0.7
              });
              clickCb(this);

              activeRegionString = newActiveLayer.feature.properties.name;
              previousActiveLayer = newActiveLayer;
            });
          }
        });
        MapService.addLeafletLayer(regionsLayer);
        if (activeRegionString) { setActiveRegion(activeRegionString); }
      });
    };

    var removeRegions = function () {
      activeRegionString = null;
      MapService.removeLeafletLayer(regionsLayer);
    };

    var setActiveRegion = function (region) {
      if (regionsLayer) {
        var layer = _getRegion(regionsLayer, region);
        if (layer) {
          layer.fire('click');
        }
      } else {
        activeRegionString = region;
      }
    };

    var _getRegion = function (Lgeo, regionName) {
      var region;
      Lgeo.eachLayer(function (layer) {
        if (layer.feature.properties.name === regionName) {
          region = layer;
        }
      });
      return region;
    };

    return {
      add: addRegions,
      remove: removeRegions,
      setActiveRegion: setActiveRegion
    };

  }]
);
