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
        var pxSize = 8;
        var icon = L.divIcon({
          iconAnchor: [pxSize, pxSize],
          html: '<svg height="' + (pxSize * 2) + '" width="' + (pxSize * 2) + '">'
                + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="' + pxSize + '" '
                + 'fill-opacity="1" fill="' + color + '" />'
                + '</svg>'
        });
        response.forEach(function (f) {
          var marker = L.marker(
            [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            {icon: icon});
          layer.addLayer(marker);
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
      this.options.start = timeState.start;
      this.options.end = timeState.end;
      this.redraw();
    },

  });

  return MarkerClusterLayer;

}]);
