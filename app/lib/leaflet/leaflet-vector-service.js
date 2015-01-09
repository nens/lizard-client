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
      LeafletService.MarkerClusterGroup.prototype.onAdd.call(this, map);

      this._map = map;

      this.addMarker = this.addLayer;
      this.removeMarker = this.removeLayer;
      this.hasMarker = this.hasLayer;

      var color = this.options.color,
          layer = this;

      VectorService.getData(this.options.slug, {})
      .then(function (response) {
        layer.markers = [];

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
          layer.addMarker(marker);
          layer.markers.push(marker);
        });

        layer.syncTime();
      });

      // simulate click on map instead of this event;
      var fireMapClick = function (e) {
        layer._map.fire('click', {
          latlng: e.latlng,
        });
      };

      this.on('clusterclick', function (e) {
        fireMapClick(e);
      });

      this.on('click', function (e) {
        fireMapClick(e);
      });

    },


    /**
     * @function
     * @description Remove geojson sublayer
     * plus call original onremove event
     * @param {object} instance of Leaflet.Map
     */
    onRemove: function (map) {
      LeafletService.MarkerClusterGroup.prototype.onRemove.call(this, map);
      this.markers.forEach(function (marker) { this.removeMarker(marker); }, this);
      this.markers = [];
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
    syncTime: function (timeState) {
      if (timeState) {
        this.timeState = timeState;
      }

      if (this.markers && this.markers.length > 0) {
        var start = this.timeState.playing ? this.timeState.at : this.timeState.start,
            end = this.timeState.playing
            ? this.timeState.at + this.timeState.aggWindow
            : this.timeState.end,
          markerTimeObject,
          mustRemoveMarker;

        this.markers.forEach(function (marker) {

          markerTimeObject = {
            timestamp_start: marker.options.timestamp_start,
            timestamp_end: marker.options.timestamp_end
          };

          mustRemoveMarker = !VectorService.isInTempExtent(markerTimeObject, {start: start, end: end});
          if (this.hasMarker(marker) && mustRemoveMarker) {
            this.removeMarker(marker);
          } else if (!this.hasMarker(marker) && !mustRemoveMarker) {
            this.addMarker(marker);
          }
        }, this);
      }

    },
  });

  return MarkerClusterLayer;

}]);
