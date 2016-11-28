'use strict';

/**
 * @ngdoc service
 * @name map.NxtRegionsLayer
 * @description
 * Adds a leaflet geojson layer to draw regions.
 */
angular.module('map')
.service('VectorizedRasterService', [
  'CabinetService',
  'LeafletService',
  'DataService',
  'MapService',
  'State',
  function (CabinetService, LeafletService, DataService, MapService, State) {

    var FILL_COLORS = {
      "d41f68d": "#886600", // bodem => brown
      "7cf5d28": "#22aa33"  // landgebruik => green
    };

    var fillOpacities = {
      "d41f68d": 1,
      "7cf5d28": 1
    };

    this.setOpacity = function (uuid, opacity) {
      fillOpacities[uuid] = opacity;
    };

    var getOpacity = function (uuid) {
      return fillOpacities[uuid];
    };

    var defaultRegionStyle = {
      weight: 2,
      opacity: 0.6,
      color: '#fff',
      fillColor: '#000',
      fillOpacity: 1
    };

    this.removeData = function (rasterMapLayer) {
      if (rasterMapLayer.leafletLayer) {
        MapService.removeLeafletLayer(rasterMapLayer.leafletLayer);
      }
    };

    this.setData = function (agg, rasterMapLayer) {
      var uuid = rasterMapLayer.uuid;
      var styles = rasterMapLayer.complexWmsOptions.styles;
      var fillColor = FILL_COLORS[uuid];
      var leafletLayer = LeafletService.nxtAjaxGeoJSON('api/v2/regions/', {
        // Add these static parameters to requests.
        requestParams: {
          raster: uuid,
          styles: styles,
          page_size: 500
        },
        // Add bbox to the request and update on map move.
        bbox: true,
        // Add zoomlevel to the request and update on map zoom.
        zoom: true,
        style: function (feature) {
          defaultRegionStyle.fillColor = feature.properties.raster
            ? feature.properties.raster.color: '';
          defaultRegionStyle.fillOpacity = getOpacity(uuid);
          return defaultRegionStyle;
        },
        onEachFeature: function (d, layer) {
          layer.on({
            mouseover: function (e) {
              var layer = e.target;
              layer.setStyle({ fillOpacity: getOpacity(uuid) * 0.3 });
            },
            mouseout: function (e) {
              var layer = e.target;
              defaultRegionStyle.fillColor = fillColor;
              defaultRegionStyle.fillOpacity = getOpacity(uuid);
              layer.setStyle(defaultRegionStyle);
            },
          });
        },
      });
      if (rasterMapLayer.leafletLayer) {
        MapService.removeLeafletLayer(rasterMapLayer.leafletLayer);
      }
      rasterMapLayer.leafletLayer = leafletLayer;
      MapService.addLeafletLayer(leafletLayer);
    };

  }]
);
