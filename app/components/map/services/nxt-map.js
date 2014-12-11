'use strict';

/**
 * @ngdoc service
 * @class NxtMap /
 * @memberof app
 * @name NxtMap
 * @requires LeafletService
 * @summary Wraps stuff around Leaflet
 * @description  NxtMap service encapsulates all kinds of helper functions
 * for the map-directive. A wrapper of sorts for Leaflet stuff,
 * the map object and mapState.
 */

angular.module('lizard-nxt')
  .factory('NxtMap', ['$rootScope', '$q', 'LeafletService',
  function ($rootScope, $q, LeafletService) {

    function NxtMap() {
      this._map = {};
    }

    NxtMap.prototype = {

      createMap: function (element, options) {
        console.log('creating map');
        this._map = createNxtMap(element, options);
      },

      /**
       * @function
       * @memberOf app.NxtMapService
       * @description sets leaflet View based on panZoom
       * @param {object} panZoom Hashtable with, lat, lng, zoom
       */
      setView: function (panZoom) {
        if (panZoom.hasOwnProperty('lat') &&
            panZoom.hasOwnProperty('lng') &&
            panZoom.hasOwnProperty('zoom'))
        {
          this._map.setView(new LeafletService.LatLng(
            panZoom.lat, panZoom.lng), panZoom.zoom);
        } else {
          this._map.setView.apply(this._map, arguments);
        }
      },

      /**
       * @function
       * @memberOf app.NxtMapService
       * @description fits leaflet to extent
       * @param  {array} extent Array with NW, NE, SW,SE
       */
      fitBounds: function (bounds) {
        if (!(bounds instanceof LeafletService.LatLngBounds)) {
          this._map.fitBounds(L.latLngBounds(
            L.latLng(bounds.south, bounds.east),
            L.latLng(bounds.north, bounds.west)));
        } else {
          this._map.fitBounds(bounds);
        }
      },

      /**
       * @description legacy function.
       */
      latLngToLayerPoint: function (latlng) {
        return this._map.latLngToLayerPoint(latlng);
      },

      /**
       * @function
       * @memberOf app.NxtMapService
       * @description Initiate map events
       * @return {void}
       */
      initiateNxtMapEvents: function (clicked, moveStarted, moveEnded, mouseMoved) {
        var map = this._map;
        var conditionalApply = function (fn, e) {
          if (!$rootScope.$$phase) {
            $rootScope.$apply(fn(e, map));
          } else {
            fn(e, map);
          }
        };

        map.on('click',     function (e) { conditionalApply(clicked, e); });
        map.on('movestart', function (e) { conditionalApply(moveStarted, e); });
        map.on('mousemove', function (e) { conditionalApply(mouseMoved, e); });
        map.on('moveend',   function (e) { conditionalApply(moveEnded, e); });
      },

      addLayer: function (layer) {
        this._map.addLayer(layer);
      },

      removeLayer: function (layer) {
        this._map.removeLayer(layer);
      }

    };

    /**
     * @function
     * @memberof app.NxtMapService
     * @param  {dynamic} mapElem can be string or Element.
     * @param  {options} Options (bounds, attribution etc.)
     * @return {L.NxtMap}   Leaflet.NxtMap instance
     * @description Creates a Leaflet map based on idString or Element.
     */
    var createNxtMap = function (mapElem, options) { // String or Element.

      var leafletMap = LeafletService.map(mapElem, options);

      if (options.addZoomTitles) {
        LeafletService.control.zoom({
          zoomInTitle: options.zoomInTitle,
          zoomOutTitle: options.zoomOutTitle
        }).addTo(leafletMap);
      }

      return leafletMap;
    };

    return NxtMap;
  }
]);
