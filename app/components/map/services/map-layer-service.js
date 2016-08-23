'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.service('MapLayerService', ['LeafletService', 'LeafletVectorService',
  function (LeafletService, LeafletVectorService) {

    this.MAXZOOMLEVEL = 21;

    this.createTmsLayer = function (options) {
      var layerUrl = options.url + '/{z}/{x}/{y}.png';

      return LeafletService.tileLayer(
        layerUrl, {
          minZoom: 0,
          maxZoom: options.maxZoom,
          zIndex: options.zIndex
        }
      );
    };

    this.createUtfLayer = function (options) {
      var url = options.url + '/{z}/{x}/{y}.{ext}';

      return new LeafletService.UtfGrid(url, {
        ext: 'grid',
        useJsonP: false,
        minZoom: options.minZoom || 0,
        maxZoom: options.maxZoom || this.MAXZOOMLEVEL,
      });
    };

    /**
     * Creates a leaflet wms layer with default wms options.
     *
     * @param  {object} options passed directly to leaflet, might overwrite
     *                          defaults.
     * @return {TileLayer.WMS}
     */
    this.createWmsLayer = function (options) {
      var _options = {
        format: 'image/png',
        version: '1.1.1',
        layers: options.slug,
        minZoom: options.minZoom || 0,
        maxZoom: options.maxZoom || this.MAXZOOMLEVEL,
        zIndex: options.zIndex,
        crs: LeafletService.CRS.EPSG3857,
      };

      _options = angular.extend(_options, options);

      return LeafletService.tileLayer.wms(options.url, _options);
    };

    this.createMarkerClusterLayer = function (options) {
      var opts = {
        layer: options,
        color: options.color,
        showCoverageOnHover: false,  // When you mouse over a cluster it shows
                                     // the bounds of its markers.
        zoomToBoundsOnClick: true,   // When you click a cluster we zoom to
                                     // its bounds.
        spiderfyOnMaxZoom: false,    // When you click a cluster at the bottom
                                     // zoom level we  do not spiderfy it
                                     // so you can see all of its markers.
        maxClusterRadius: 80,        // The maximum radius that a cluster will
                                     // cover from the central marker
                                     // (in pixels). Default 80. Decreasing
                                     // will make more and smaller clusters.
                                     // Set to 1 for clustering only when
                                     // events are on the same spot.
        animateAddingMarkers: false, // Enable for cool animations but its
                                     // too slow for > 1000 events.
        iconCreateFunction: function (cluster) {
          var size = cluster.getAllChildMarkers().length,
              pxSize;

          if (size > 1024) {
            pxSize = 30;
          } else if (size > 256) {
            pxSize = 26;
          } else if (size > 64) {
            pxSize = 22;
          } else if (size > 32) {
            pxSize = 20;
          } else if (size > 16) {
            pxSize = 18;
          } else if (size > 8) {
            pxSize = 16;
          } else if (size > 4) {
            pxSize = 14;
          } else {
            pxSize = 12;
          }

          // Return two circles, an opaque big one with a smaller one on top
          // and white text in the middle. With radius = pxSize.
          return L.divIcon({
            iconAnchor: [pxSize, pxSize],
            html: '<svg height="' + (pxSize * 2) + '" width="' + (pxSize * 2)
                  + '">'
                  + '<circle cx="' + pxSize + '" cy="' + pxSize
                  + '" r="' + pxSize + '" fill-opacity="0.4" fill="'
                  + options.color + '" />'
                  + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="'
                  + (pxSize - 2) + '" fill-opacity="1" fill="'
                  + options.color + '" />'
                  + '<text x="' + pxSize + '" y="' + (pxSize + 5)
                  + '" style="text-anchor: middle; fill: white;">'
                  + size + '</text>'
                  + '</svg>'
          });
        },
        callbackClick: function (e, features) {
          options.spatialSelect(e.latlng);
        }
      };

      return new LeafletVectorService(opts);
    };

  }]
);
