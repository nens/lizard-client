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
    allMarkers: [],

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
          if (f.properties.timestamp_start === undefined) {
            console.log("[E] Tried to built marker w/o available attr: timestamp_start");
            throw new Error("abort.");
          } else {
            console.log("[+] f.properties.timestamp_start =", f.properties.timestamp_start);
          }
          marker = L.marker(
            [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            {
              icon: icon,
              timestamp_start: f.properties.timestamp_start,
              timestamp_end: f.properties.timestamp_end
            });
          layer.addMarkerToLayer(marker);
          layer.allMarkers.push(marker);
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
          end = timeState.at + timeState.aggWindow,
          that = this,
          markerTimeObject,
          mustRemoveMarker;

      that.allMarkers.forEach(function (marker) {

        console.log("marker.options.timestamp_start = ", marker.options.timestamp_start);

        markerTimeObject = {
          timestamp_start: marker.options.timestamp_start,
          timestamp_end: marker.options.timestamp_end
        };

        if (markerTimeObject.timestamp_start === undefined)
          throw new Error("[E] Found marker w/o timestamp_start");

        mustRemoveMarker = !VectorService.isInTempExtent(markerTimeObject, timeState);
        if (that.hasLayer(marker) && mustRemoveMarker) {
          that.removeMarkerFromLayer(marker);
        } else if (!that.hasLayer(marker) && !mustRemoveMarker) {
          that.addMarkerToLayer(marker);
        }
      });

      this.options.start = timeState.start;
      this.options.end = timeState.end;
    },
  });

  return MarkerClusterLayer;

}]);
