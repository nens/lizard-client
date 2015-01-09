'use strict';

/**
 * @ngdoc service
 * @name LeafletVectorService
 * @description
 * # LeafletVector
 * Creates a Tiled Layer for retrieving and drawing vector data.
 */
angular.module('lizard-nxt')
  .service('LeafletVectorService', ["LeafletService", "VectorService", "UtilService",
      function (LeafletService, VectorService, UtilService) {

  var MarkerClusterLayer = LeafletService.MarkerClusterGroup.extend({

    // Define aliasses that makes sense in the nxt world
    markers: [],

    // Define aliasses that makes sense in the nxt world
    addMarkerToLayer: function (marker) {
      this.addLayer(marker);
    },

    removeMarkerFromLayer: function (marker) {
      this.removeLayer(marker);
    },

    /**
     * @function
     * @description adds functionality to original Add function
     * of Leaflet.
     */
    onAdd: function (map) {
      LeafletService.MarkerClusterGroup.prototype.onAdd.call(this, map);

      this._map = map;

      var color = this.options.color,
          layer = this;

      VectorService.getData(this.options.slug, {})
      .then(function (response) {
        var pxSize = 4,
            marker;

        var icon = L.divIcon({
          iconAnchor: [pxSize, pxSize],
          html: '<svg height="' + (pxSize * 2) + '" width="' + (pxSize * 2) + '">'
                + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="' + pxSize + '" '
                + 'fill-opacity="0.9" fill="' + color + '" />'
                + '</svg>'
        });

        response.forEach(function (f) {
          marker = L.marker(
            [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            {
              icon: icon,
              timestamp_start: f.properties.timestamp_start,
              timestamp_end: f.properties.timestamp_end
            });
          layer.addMarkerToLayer(marker);
          layer.markers.push(marker);
        });
        layer.syncTime();
      });
    },

    /**
     * @function
     * @description Implements opacity handler like other TileLayers
     * @params {float} amount of opacity between 0 and 1.
     */
    setOpacity: function (opacity) {
      // TODO: figure out why it is possible to call setOpacity while there is
      // no geojsonlayer.
      if (this.geojsonLayer) {
        this.geojsonLayer.setStyle({
          opacity: opacity,
          fillOpacity: opacity
        });
      }
    },

    /**
     * @function
     * @description sync the time
     */
    syncTime: function (timeState, map) {

      this.options.start = timeState.start;
      this.options.end = timeState.end;

      if (this.markers.length > 0) {
        var start = timeState.playing ? timeState.at : timeState.start,
          end = timeState.playing
            ? timeState.at + timeState.aggWindow
            : timeState.end,
          markerTimeObject,
          mustRemoveMarker;

        this.markers.forEach(function (marker) {

          markerTimeObject = {
            timestamp_start: marker.options.timestamp_start,
            timestamp_end: marker.options.timestamp_end
          };

          mustRemoveMarker = !VectorService.isInTempExtent(markerTimeObject, timeState);
          if (this.hasLayer(marker) && mustRemoveMarker) {
            this.removeMarkerFromLayer(marker);
          } else if (!this.hasLayer(marker) && !mustRemoveMarker) {
            this.addMarkerToLayer(marker);
          }
        }, this);
      }

    },
  });

  return MarkerClusterLayer;

}]);
