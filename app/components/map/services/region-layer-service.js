'use strict';

/**
 * @ngdoc service
 * @name map.NxtRegionsLayer
 * @description
 * Adds a leaflet geojson layer to draw regions.
 */
angular.module('map')
.factory('NxtRegionsLayer', [
  'CabinetService',
  'LeafletService',
  'State',
  function (CabinetService, LeafletService, State) {

    var STYLES = {

      // 1/3: default styling for a region:
      default: {
        weight: 2,
        opacity: 0.6,
        color: '#7f8c8d', // asbestos
        fillOpacity: 0
      },

      // 2/3: styling for a region when it is being hovered:
      mouseOver: {
        fillColor: '#e74c3c', // alizarin
        fillOpacity: 0.1,
        dashArray: '',
        weight: 2,
        color: '#7f8c8d', // asbestos
      },

      // 3/3: styling for a region when it is the selected region:
      active: {
        weight: 4,
        fillColor: '#e74c3c', // alizarin
        color: '#c0392b', // pomegranate
        dashArray: '6',
        fillOpacity: 0.1
      }
    };

    // Leaflet geojson layer.
    var regionsLayer = null;

    // String of feature.properties.name that should be active.
    var activeRegionId = null;

    function addRegions (mapService, regions, clickCb) {
      if (regionsLayer) {
        mapService.removeLeafletLayer(regionsLayer);
      }

      regionsLayer = LeafletService.geoJson(regions, {

        style: function (feature) {
          return activeRegionId === feature.id
            ? STYLES.active
            : STYLES.default;
        },

        onEachFeature: function (d, layer) {
          layer.on({
            mouseover: function (e) {
              if (e.target.feature.id !== activeRegionId) {
                e.target.setStyle(STYLES.mouseOver);
              }
            },
            mouseout: function (e) {
              regionsLayer.resetStyle(e.target);
            },
            click: function (e) {
              if (activeRegionId === e.target.feature.id) {
                activeRegionId = null;
                e.target.setStyle(STYLES.mouseOver);
                // We need to update the State since a geometry got deselected
                // by re-clicking it:
                deactivateOldGeometry(e.target.feature.id);
              } else {
                activeRegionId = e.target.feature.id;
                clickCb(this);
                addRegions(mapService, regions, clickCb);
              }
            }
          });
        }
      });

      mapService.addLeafletLayer(regionsLayer);
    }

    function deactivateOldGeometry (regionId) {
      var deactivedRegionGeometry = _.find(
        State.geometries,
        { id: regionId }
      );
      if (deactivedRegionGeometry) {
        State.geometries.removeGeometry(deactivedRegionGeometry);
      } else {
        console.error(
          "[E] Cannot remove geometry for region #"
          + regionId
          + " because it is not present in State.geometries!"
        );
      }
    }

    function removeRegions (mapService) {
      activeRegionId = null;
      mapService.removeLeafletLayer(regionsLayer);
    }

    function resetActiveRegion (mapService) {
      var region = _getRegion(regionsLayer, activeRegionId);
      activeRegionId = null;
      if (region) {
        regionsLayer.resetStyle(region);
      }
    }

    var _getRegion = function (lGeo, regionId) {
      var region;
      lGeo.eachLayer(function (layer) {
        if (layer.feature.id === regionId) {
          region = layer;
        }
      });
      return region;
    };

    return {
      add: addRegions,
      remove: removeRegions,
      resetActiveRegion: resetActiveRegion
    };
  }
]);
