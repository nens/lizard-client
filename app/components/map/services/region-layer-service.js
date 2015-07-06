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

    // Leaflet geojson layer.
    var regionsLayer;

    // ILayer of last region that recieved click.
    var activeRegionString;

    // ILayer of 2nd to last region that recieved click.
    var previousActiveLayer;

    /**
     * Makes call to api for regions of the given bounds and zoom and calls
     * _drawRegions function.
     *
     * @param {int} z          zoomlevel to get regions.
     * @param {L.LatLngBounds} bounds of current map view.
     * @param {function}       clickCb callback to call when user clicks region.
     */
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
      }).then(_drawRegions);
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
     * Draws regions as a L.geoJson layer on the map. Sets click function. And
     * Fires click if ActiveRegionString is not falsy.
     *
     * @param  {geojson} regions
     */
    var _drawRegions = function (regions) {
      MapService.removeLeafletLayer(regionsLayer);
      regionsLayer = LeafletService.geoJson(regions.results, {
        // Style function must be included in order to overwrite style on click.
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
    };

    /**
     * Gets region layer with properties.name === regionName of the currently drawn
     * regions.
     *
     * @param  {L.GeoJson} Lgeo        Leaflet L.GeoJson instance.
     * @param  {string} regionName     Properties.name of region
     * @return {L.ILayer || undefined} Region layer.
     */
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
