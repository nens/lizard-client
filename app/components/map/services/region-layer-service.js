'use strict';

/**
 * @ngdoc service
 * @name map.NxtRegionsLayer
 * @description
 * Adds a leaflet geojson layer to draw regions.
 */
angular.module('map')
.factory('NxtRegionsLayer', [
  'MapService',
  'CabinetService',
  'LeafletService',
  function (MapService, CabinetService, LeafletService) {

    // Leaflet geojson layer.
    var regionsLayer;

    // ILayer of last region that recieved click.
    var activeRegionString;

    // ILayer of 2nd to last region that recieved click.
    var previousActiveLayer;

    /**
     * Draws regions as a L.geoJson layer on the map. Sets click function. And
     * Fires click if ActiveRegionString is not falsy.
     *
     * @param  {geojson}  regions
     * @param  {funciton} clickCb callback fires when layer is clicked.
     */
    var addRegions = function (regions, clickCb) {
      MapService.removeLeafletLayer(regionsLayer);
      regionsLayer = LeafletService.geoJson(regions, {
        // Style function must be included in order to overwrite style on click.
        style: function (feature) { return {}; },
        onEachFeature: function (d, layer) {
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
    };

    /**
     * Removes the regions from the map and sets activeRegioString to null.
     */
    var removeRegions = function () {
      activeRegionString = null;
      MapService.removeLeafletLayer(regionsLayer);
    };

    /**
     * Sets the activeRegion, by firing a click when regionsLayer exists, or
     * sets activeRegionString that triggers a call of this function onload.
     *
     * @param {string} region properties.name of region.
     */
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

    /**
     * Gets region layer with properties.name === regionName of the currently
     * drawn regions.
     *
     * @param  {L.GeoJson} lGeo        Leaflet L.GeoJson instance.
     * @param  {string} regionName     Properties.name of region
     * @return {L.ILayer || undefined} Region layer.
     */
    var _getRegion = function (lGeo, regionName) {
      var region;
      lGeo.eachLayer(function (layer) {
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
