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
  function (CabinetService, LeafletService) {

    // Leaflet geojson layer.
    var regionsLayer;

    // String of feature.properties.name that should be active.
    var activeRegionId;

    // ILayer of last region that recieved click.
    var previousActiveLayer;

    var defaultRegionStyle = {
      weight: 2,
      opacity: 0.6,
      color: '#7f8c8d', // asbestos
      fillOpacity: 0
    };

    var mouseOverStyle = {
      fillColor: '#e74c3c', // alizarin
      fillOpacity: 0.1
    };

    var activeRegionStyle = {
      weight: 4,
      fillColor: '#e74c3c', // alizarin
      color: '#c0392b', // pomegranate
      dashArray: '6',
      fillOpacity: 0.1
    };

    /**
     * Draws regions as a L.geoJson layer on the map. Sets click function. And
     * Fires click if activeRegionId is not falsy.
     *
     * @param  {geojson}  regions
     * @param  {funciton} clickCb callback fires when layer is clicked.
     */
    var addRegions = function (MapService, regions, clickCb) {
      MapService.removeLeafletLayer(regionsLayer);
      regionsLayer = LeafletService.geoJson(regions, {
        // Style function must be included in order to overwrite style on click.
        style: function (feature) {

          return defaultRegionStyle;
        },
        onEachFeature: function (d, layer) {
          layer.on({
            mouseover: function (e) {
              var layer = e.target;

              layer.setStyle(mouseOverStyle);

            },
            mouseout: function (e) {
              if (e.target.feature.id !== activeRegionId) {
                regionsLayer.resetStyle(e.target);
              }
            },
            click: function (e) {

              if (previousActiveLayer) {
                regionsLayer.resetStyle(previousActiveLayer);
              }

              var newActiveLayer = e.target;
              newActiveLayer.setStyle(activeRegionStyle);

              clickCb(this);

              activeRegionId = newActiveLayer.feature.id;
              previousActiveLayer = newActiveLayer;
            }
          });
        }
      });
      MapService.addLeafletLayer(regionsLayer);
      if (activeRegionId) { setActiveRegion(activeRegionId); }
    };

    /**
     * Removes the regions from the map and sets activeRegioString to null.
     */
    var removeRegions = function (MapService) {
      activeRegionId = null;
      MapService.removeLeafletLayer(regionsLayer);
    };

    /**
     * Sets the activeRegion, by firing a click when regionsLayer exists, or
     * sets activeRegionId that triggers a call of this function onload.
     *
     * @param {string} region feature.id of region.
     */
    var setActiveRegion = function (region) {
      if (regionsLayer) {
        var layer = _getRegion(regionsLayer, region);
        if (layer) {
          layer.fire('click');
        }
        else {
          activeRegionId = null;
        }
      } else {
        activeRegionId = region;
      }
    };

    var getActiveRegion = function () {
      return activeRegionId;
    };

    /**
     * Gets region layer with properties.name === regionName of the currently
     * drawn regions.
     *
     * @param  {L.GeoJson} lGeo        Leaflet L.GeoJson instance.
     * @param  {string} regionName     Properties.name of region
     * @return {L.ILayer} Region layer or undefined if not found
     */
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
      setActiveRegion: setActiveRegion,
      getActiveRegion: getActiveRegion
    };

  }]
);
