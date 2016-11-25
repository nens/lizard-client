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

    // Leaflet geojson layers, one per vectorizable raster
    var vectorizedRasterLayers = {};
    var self = this;
    self.regions = undefined;

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

    this.hasVectorizedRasterLayers = function () {
      return Object.keys(vectorizedRasterLayers).length > 0;
    };

    var getData = function (uuid, opacity) {
      if (!self.regions || !vectorizedRasterLayers[uuid]) { return; }

      var fillColor = FILL_COLORS[uuid];
      var leafletLayer = LeafletService.geoJson(self.regions.results, {
        style: function (feature) {
          defaultRegionStyle.fillColor = fillColor;
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

      MapService.removeLeafletLayer(vectorizedRasterLayers[uuid].leafletLayer);
      vectorizedRasterLayers[uuid].leafletLayer = leafletLayer;
      MapService.addLeafletLayer(leafletLayer);
    };

    this.updateLayer = function (layer) {
      console.log("[F] updateLayer; uuid:", layer.uuid);
      if (vectorizedRasterLayers[layer.uuid] &&
          vectorizedRasterLayers[layer.uuid].leafletLayer) {
        MapService.removeLeafletLayer(
          vectorizedRasterLayers[layer.uuid].leafletLayer);
      }
      getData(layer.uuid, fillOpacities[layer.uuid]);
    };

    this.deleteLayer = function (uuid, resetOpacity) {
      console.log("[F] deleteLayer; uuid:", uuid);
      if (vectorizedRasterLayers[uuid].leafletLayer !== undefined) {
        MapService.removeLeafletLayer(
          vectorizedRasterLayers[uuid].leafletLayer
        );
      }
      if (resetOpacity) {
        fillOpacities[uuid] = 1;
      }
      delete vectorizedRasterLayers[uuid];
    };

    this.setRegions = function (mustUpdate) {
      console.log("[F] setRegions");
      if (State.spatial.bounds && State.spatial.bounds.getWest) {
        var httpOpts = { timeout: 10 };
        CabinetService.regions.get({
          z: State.spatial.view.zoom,
          in_bbox: State.spatial.bounds.getWest()
            + ','
            + State.spatial.bounds.getNorth()
            + ','
            + State.spatial.bounds.getEast()
            + ','
            + State.spatial.bounds.getSouth()
          }
        ).then(function (regions) {
          self.regions = regions;
          if (mustUpdate) {
            self.updateAllLayers();
          }
        });
      }
    };

    this.updateAllLayers = function () {

      console.log("[F] updateAllLayers");

      if (!self.regions) {
        self.setRegions();
      }

      _.forEach(State.layers, function (layer) {
        if(layer.type !== "raster") { return; }
        var mapLayer = _.find(MapService.mapLayers, { uuid: layer.uuid });
        if (mapLayer === undefined) { return; }

        var showVectorized = mapLayer.showVectorized;
        if (layer.active && showVectorized) {
          if (vectorizedRasterLayers[layer.uuid] === undefined) {
            vectorizedRasterLayers[layer.uuid] = {
              uuid: layer.uuid,
              name: layer.name,
              showVectorized: showVectorized,
              opacity: fillOpacities[layer.uuid],
              leafletLayer: undefined,
            };
          }

          vectorizedRasterLayers[layer.uuid].active = true;
          vectorizedRasterLayers[layer.uuid].showVectorized = true;
          self.updateLayer(layer);
        } else if (vectorizedRasterLayers[layer.uuid]) {
          self.deleteLayer(layer.uuid);
        }
      });
    };
  }]
);
