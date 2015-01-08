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
    addMarker: this.addLayer,
    removeMarker: this.removeLayer,
    markers: [],
    removedMarkers: [],

    /**
     * @function
     * @description adds functionality to original Add function
     * of Leaflet.
     */
    onAdd: function (map) {
      this._map = map;
      LeafletService.MarkerClusterGroup.prototype.onAdd.call(this, map);

      var color = this.options.color;

      var layer = this;
      VectorService.getData(this.options.slug, {})
      .then(function (response) {
        var pxSize = 4;
        var icon = L.divIcon({
          iconAnchor: [pxSize, pxSize],
          html: '<svg height="' + (pxSize * 2) + '" width="' + (pxSize * 2) + '">'
                + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="' + pxSize + '" '
                + 'fill-opacity="0.9" fill="' + color + '" />'
                + '</svg>'
        });
        var marker;
        response.forEach(function (f) {
          marker = L.marker(
            [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            {
              icon: icon,
              start: f.properties.start,
              end: f.properties.end
            });
          layer.addMarker(marker);
          layer.markers.push(marker);
        });
      });

      var size = this._map.getPixelBounds().getSize();

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
    syncTime: function (layer, timeState) {
      var start = timeState.at,
          end = timeState.at + timeState.aggWindow;
      // remove all markers outside temp bound
      this.markers.forEach(function (marker) {
        var toRm = marker.options.start > start || marker.options.end < end;
        if (toRm && this.hasMarker(marker)) { this.removeMarker(marker); }
        if (!toRm && !this.hasMarker(marker)) { this.addMarker(marker); }
        return;
      }, this)
      //
      // add all markers that were outside of the temp bounds
      this.options.start = timeState.start;
      this.options.end = timeState.end;
      this.redraw();
    },

  });

  return MarkerClusterLayer;

}]);
