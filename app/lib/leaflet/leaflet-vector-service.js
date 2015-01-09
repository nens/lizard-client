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
    //addMarker: this.addLayer,
    //removeMarker: this.removeLayer,
    //markers: [],
    // displayedMarkers: [],
    // removedMarkers: [],
    allMarkers: [],

    // Define aliasses that makes sense in the nxt world
    addMarkerToLayer: function (marker) {
      //this.markers.push(marker);
      this.addLayer(marker);

      // We need to rm this marker from the list 'removedMarkers'; expensive,
      // but undoable any other way?

      // var tmpRemovedMarkers = [];
      // this.removedMarkers.forEach(function (removedMarker) {
      //   if (JSON.stringify(marker) !== JSON.stringify(removedMarker)) {
      //     tmpRemovedMarkers.push(removedMarker);
      //   }
      // });
      // this.removedMarkers = tmpRemovedMarkers;
    },

    removeMarkerFromLayer: function (marker) {
      //this.removedMarkers.push(marker);
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
          marker = L.marker(
            [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            {
              icon: icon,
              start: f.properties.start,
              end: f.properties.end
            });
          layer.addMarkerToLayer(marker);
          //layer.displayedMarkers.push(marker);
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
          that = this;

      that.allMarkers.forEach(function (marker) {

        var mustRemoveMarker = !VectorService.isInTempExtent(marker.toGeoJSON(), timeState);
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
