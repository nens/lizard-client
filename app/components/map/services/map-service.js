'use strict';

/**
 * @ngdoc service
 * @class MapService
 * @memberof app
 * @name MapService
 * @requires NxtMap
 * @summary stores global NxtMap instance of the app.
 */

angular.module('lizard-nxt')
.service('MapService', ['$rootScope', '$q', 'LeafletService', 'DataService',
  function ($rootScope, $q, LeafletService, DataService) {

    // var service = {

    //   _map: {},

    //   createMap: function (element, options) {
    //     service._map = createLeafletMap(element, options);
    //   },

    //   initializeLayers: function () {
    //     angular.forEach(DataService.layerGroups, function (lg, lgSlug) {
    //       angular.forEach(lg.mapLayers, function (layer, lSlug) {
    //         if (layer.tiled) {
    //           layer._leafLetLayer = intializers[layer.format](layer);
    //         } else {
    //           // angular.extend(layer, new nonTiledWmsLayer(layer))
    //         }
    //       });
    //     });
    //   },

    //   /**
    //    * @function
    //    * @memberOf app.NxtMapService
    //    * @description sets leaflet View based on panZoom
    //    * @param {object} panZoom Hashtable with, lat, lng, zoom
    //    */
    //   setView: function (panZoom) {
    //     if (panZoom.hasOwnProperty('lat') &&
    //         panZoom.hasOwnProperty('lng') &&
    //         panZoom.hasOwnProperty('zoom'))
    //     {
    //       service._map.setView(new LeafletService.LatLng(
    //         panZoom.lat, panZoom.lng), panZoom.zoom);
    //     } else {
    //       service._map.setView.apply(service._map, arguments);
    //     }
    //   },

    //   /**
    //    * @function
    //    * @memberOf app.NxtMapService
    //    * @description fits leaflet to extent
    //    * @param  {array} extent Array with NW, NE, SW,SE
    //    */
    //   fitBounds: function (bounds) {
    //     if (!(bounds instanceof LeafletService.LatLngBounds)) {
    //       service._map.fitBounds(L.latLngBounds(
    //         L.latLng(bounds.south, bounds.east),
    //         L.latLng(bounds.north, bounds.west)));
    //     } else {
    //       service._map.fitBounds(bounds);
    //     }
    //   },

    //   /**
    //    * @description legacy function.
    //    */
    //   latLngToLayerPoint: function (latlng) {
    //     return service._map.latLngToLayerPoint(latlng);
    //   },

    //   /**
    //    * @function
    //    * @memberOf app.NxtMapService
    //    * @description Initiate map events
    //    * @return {void}
    //    */
    //   initiateNxtMapEvents: function (clicked, moveStarted, moveEnded, mouseMoved) {
    //     var map = service._map;
    //     var conditionalApply = function (fn, e) {
    //       if (!$rootScope.$$phase) {
    //         $rootScope.$apply(fn(e, map));
    //       } else {
    //         fn(e, map);
    //       }
    //     };

    //     map.on('click',     function (e) { conditionalApply(clicked, e); });
    //     map.on('movestart', function (e) { conditionalApply(moveStarted, e); });
    //     map.on('mousemove', function (e) { conditionalApply(mouseMoved, e); });
    //     map.on('moveend',   function (e) { conditionalApply(moveEnded, e); });
    //   },

    //   addLayer: function () {
    //     var defer = $q.defer();
    //     if (this._leafletLayer) {
    //       this._addLeafletLayer(service.map, this._leafletLayer);
    //       this._leafletLayer.on('load', function () {
    //         defer.resolve();
    //       });
    //     }
    //     return defer.promise;
    //   },

    //   removeLayer: function () {
    //     if (this._leafletLayer) {
    //       this._removeLeafletLayer(map, this._leafletLayer);
    //     }
    //   }

    //   /**
    //    * @function
    //    * @memberof app.layerService
    //    * @param  {L.Class} Leaflet map
    //    * @param  {L.Class} Leaflet layer
    //    * @description Removes layer from map
    //    */
    //   _addLeafletLayer: function (map, leafletLayer) {
    //     if (map.hasLayer(leafletLayer)) {
    //       throw new Error(
    //         'Attempted to add layer' + leafletLayer._id
    //         + 'while it was already part of the map'
    //       );
    //     } else {
    //       map.addLayer(leafletLayer);
    //     }
    //   },

    //   /**
    //    * @function
    //    * @memberof app.layerService
    //    * @param  {L.Class} Leaflet map
    //    * @param  {L.Class} Leaflet layer
    //    * @description Removes layer from map
    //    */
    //   _removeLeafletLayer: function (map, leafletLayer) { // Leaflet NxtLayer
    //     if (map.hasLayer(leafletLayer)) {
    //       map.removeLayer(leafletLayer);
    //     }
    //   },

    // };

    // /**
    //  * @function
    //  * @memberof app.NxtMapService
    //  * @param  {dynamic} mapElem can be string or Element.
    //  * @param  {options} Options (bounds, attribution etc.)
    //  * @return {L.NxtMap}   Leaflet.NxtMap instance
    //  * @description Creates a Leaflet map based on idString or Element.
    //  */
    // var createLeafletMap = function (mapElem, options) { // String or Element.

    //   var leafletMap = LeafletService.map(mapElem, options);

    //   if (options.addZoomTitles) {
    //     LeafletService.control.zoom({
    //       zoomInTitle: options.zoomInTitle,
    //       zoomOutTitle: options.zoomOutTitle
    //     }).addTo(leafletMap);
    //   }

    //   return leafletMap;
    // };

    // return service;
  }]);


