'use strict';

/**
 * @ngdoc service
 * @name LeafletVectorService
 * @description
 * # LeafletVector
 * Creates a Tiled Layer for retrieving and drawing vector data.
 */
angular.module('lizard-nxt')
.service('LeafletVectorService', [
  "LeafletService",
  "VectorService",
  "UtilService",
  "State",
  function (LeafletService, VectorService, UtilService, State) {

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
      this.markers = [];

      this.addData();

      var layer = this;

      this.on('clusterclick', function (e) {
        var features = [];
        e.layer.getAllChildMarkers().forEach(function (marker) {
          features.push(marker.options.feature);
        });
        layer.options.callbackClick(e, features);
      });

      this.on('click', function (e) {
        var features = [e.layer.options.feature];
        layer.options.callbackClick(e, features);
      });

    },

    addData: function () {

      var color = this.options.color,
          layer = this;

      // TODO: when the vector service returns data we need to sync the time.
      // But this is async and this function is called by leaflet's onAdd. So
      // this, as in layer (this context), is unreferenced and timeState on
      // this is lost. For now leaflet-vector-service depends on global state,
      // but really this whole async business should go somewhere else, like
      // map-service.
      VectorService.getData('leaflet', this.options.layer, {})
      .then(function (response) {
        layer.clearLayers();
        layer.markers = [];

        var pxSize = 10,
            marker;

        var icon = L.divIcon({
          iconAnchor: [pxSize, pxSize],
          html: '<svg height="' + (pxSize * 2) + '" width="' + (pxSize * 2)
            + '">'
            + '<circle cx="' + pxSize + '" cy="' + pxSize
            + '" r="' + pxSize + '" fill-opacity="0.4" fill="'
            + color + '" />'
            + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="'
            + (pxSize - 2) + '" fill-opacity="1" fill="'
            + color + '" />'
            + '<text x="' + pxSize + '" y="' + (pxSize + 5)
            + '" style="text-anchor: middle; fill: white;">'
            + 1 + '</text>'
            + '</svg>'
        });


        response.forEach(function (f) {
          var start;
          var end;

          if (f.properties.hasOwnProperty('timestamp')) {
            start = end = f.properties.timestamp;
          } else {
            start = f.properties.timestamp_start;
            end = f.properties.timestamp_end;
          }

          marker = L.marker(
            [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            {
              icon: icon,
              timestamp_start: start,
              timestamp_end: end,
              feature: f
            });
          layer.addMarker(marker);
          layer.markers.push(marker);
        });

        layer.syncTime(State.temporal);
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
      this.clearLayers();
      this.markers = [];
      VectorService.invalidateData(this.options.layer);
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
