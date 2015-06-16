'use strict';

/**
 * @ngdoc service
 * @class MapService
 * @memberof app
 * @name MapService
 * @requires NxtMap
 * @summary stores global NxtMap instance of the app.
 */

angular.module('map')
.service('MapService', ['$rootScope', '$q', 'LeafletService', 'LeafletVectorService', 'DataService', 'NxtNonTiledWMSLayer', 'NxtMapLayer', 'State',
  function ($rootScope, $q, LeafletService, LeafletVectorService, DataService, NxtNonTiledWMSLayer, NxtMapLayer, State) {

    var service = {

      _map: {}, // exposure is legacy, we should not mingle with the leaflet
                // map instance outside of the map component.

      /**
       * Initializes the map service
       * @param  {DOMelement} element      used by leaflet as the map container.
       * @param  {object} mapOptions       passed to leaflet for the map
       * @param  {object} eventCallbackFns used on leaflet map events [onmove etc]
       */
      initializeMap: function (element, mapOptions, eventCallbackFns) {
        service._map = createLeafletMap(element, mapOptions);
        this.initializeLayers(State.temporal);
        this._initializeNxtMapEvents(eventCallbackFns);
        // Map-services is dependant on the dataservice. This is to prevent
        // a bunch of complicated and slow watches and still keep the data-
        // service as the data authority.
        DataService.eventCallbacks = {
          onCreateLayerGroup: this.initializeLayer,
          onToggleLayerGroup: this._toggleLayers,
          onOpacityChange: this._setOpacity,
          onDblClick: this._rescaleContinuousData
        };
        // Turn active layergroups on.
        angular.forEach(State.layerGroups.active, function (lgSlug) {
          this._toggleLayers(DataService.layerGroups[lgSlug]);
        }, this);
      },

      /**
       * Syncs all layer groups to provided timeState object.
       * @param  {object} timeState   State.temporal object, containing start,
       *                              end, at and aggwindow.
       * @param  {leaflet map} optionalMap map object to sync the data to.
       * @return {promise}             promise that resolves layergroups synced.
       */
      syncTime: function (timeState) {
        var defer = $q.defer();
        var promises = [];
        angular.forEach(DataService.layerGroups, function (layerGroup) {
          if (layerGroup.isActive()) {
            angular.forEach(layerGroup.mapLayers, function (layer) {
              var p = layer.syncTime(timeState, service._map);
              if (p) {
                promises.push(p);
              }
            });
          } else {
            angular.forEach(layerGroup.mapLayers, function (layer) {
              layer.timeState = angular.copy(timeState);
            });
          }
        });
        var that = this;
        $q.all(promises).then(function () {
          State.layerGroups.timeIsSyncing = false;
          defer.resolve();
          return defer.promise;
        });
        if (promises.length > 0) {
          State.layerGroups.timeIsSyncing = true;
        }
        return defer.promise;
      },

      /**
       * @function
       * @memberOf map.MapService
       * @description sets leaflet View based on panZoom
       * @param {object} panZoom Hashtable with, lat, lng, zoom
       */
      setView: function (panZoom) {
        if (panZoom.hasOwnProperty('lat') &&
            panZoom.hasOwnProperty('lng') &&
            panZoom.hasOwnProperty('zoom'))
        {
          service._map.setView(new LeafletService.LatLng(
            panZoom.lat, panZoom.lng), panZoom.zoom);
        } else {
          service._map.setView.apply(service._map, arguments);
        }
      },

      /**
       * @function
       * @memberOf map.MapService
       * @description fits leaflet to extent
       * @param  {array} extent Array with NW, NE, SW,SE
       */
      fitBounds: function (bounds) {
        if (service._map instanceof LeafletService.Map) {
          if (bounds instanceof LeafletService.LatLngBounds) {
            service._map.fitBounds(bounds);
          }
          else if (bounds.hasOwnProperty('south')
            && bounds.hasOwnProperty('north')
            && bounds.hasOwnProperty('east')
            && bounds.hasOwnProperty('west')) {
            service._map.fitBounds(L.latLngBounds(
              L.latLng(bounds.south, bounds.east),
              L.latLng(bounds.north, bounds.west)));
          }
        }
      },

      getView: function () {
        return {
          lat: service._map.getCenter().lat,
          lng: service._map.getCenter().lng,
          zoom: service._map.getZoom()
        };
      },

      getBounds: function () {
        return service._map.getBounds();
      },

      /**
       * @description legacy function.
       */
      latLngToLayerPoint: function (latlng) {
        return service._map.latLngToLayerPoint(latlng);
      },

      /**
       * @function
       * @memberOf map.MapService
       * @description Initiate map events
       * @return {void}
       */
      _initializeNxtMapEvents: function (cbs) {
        var map = service._map;
        var conditionalApply = function (fn, e) {
          if (!$rootScope.$$phase) {
            $rootScope.$apply(fn(e, map));
          } else {
            fn(e, map);
          }
        };

        map.on('click',     function (e) { conditionalApply(cbs.onClick, e); });
        map.on('movestart', function (e) { conditionalApply(cbs.onMoveStart, e); });
        map.on('mousemove', function (e) { conditionalApply(cbs.onMouseMove, e); });
        map.on('moveend',   function (e) { conditionalApply(cbs.onMoveEnd, e); });
      },

      /**
       * @function
       * @memberOf map.MapService
       * @param  {L.Class} Leaflet map
       * @param  {L.Class} Leaflet layer
       * @description Removes layer from map
       */
      addLeafletLayer: function (leafletLayer) {
        if (service._map.hasLayer(leafletLayer)) {
          throw new Error(
            'Attempted to add layer' + leafletLayer._id
            + 'while it was already part of the map'
          );
        } else {
          service._map.addLayer(leafletLayer);
        }
      },

      /**
       * @function
       * @memberOf map.MapService
       * @param  {L.Class} Leaflet map
       * @param  {L.Class} Leaflet layer
       * @description Removes layer from map
       */
      removeLeafletLayer: function (leafletLayer) { // Leaflet NxtLayer
        if (service._map.hasLayer(leafletLayer)) {
          service._map.removeLayer(leafletLayer);
        }
      },


      _toggleLayers: function (lg) {
        if (lg.isActive() && lg.mapLayers.length > 0) {
          if (lg.temporal) {
            // copy timeState to layers so when added they will respect the
            // current timestate and can make independent descisions about when
            // to sync to new timestate.
            angular.forEach(lg.mapLayers, function (layer) {
              layer.timeState = angular.copy(State.temporal);
            });
          }
          addLayersRecursively(service._map, lg.mapLayers, 0);
        }
        else {
          angular.forEach(lg.mapLayers, function (layer) {
            if (layer._leafletLayer) {
              layer._leafletLayer.off('load');
              layer._leafletLayer.off('loading');
            }
            layer.remove(service._map);
          });
        }
        if (lg.getOpacity()) {
          angular.forEach(lg.mapLayers, function (layer) {
            layer.setOpacity(lg.getOpacity());
          });
        }
      },

      /**
       * @memberOf map.MapService
       * @param {object} layer passed
       * @description determine if raster layer can be rescaled
       */
      _rescaleContinuousData: function (lg) {
        var bounds = service._map.getBounds();
        angular.forEach(lg.mapLayers, function (layer) {
          layer.rescale(bounds);
        });
      },


      /**
       * @function
       * @memberOf map.MapService
       * @param {float} new opacity value
       * @return {void}
       * @description Changes opacity in layers that have
       * an opacity to be set
       */
      _setOpacity: function (lg) {
        if (lg.isActive()) {
          angular.forEach(lg.mapLayers, function (layer) {
            layer.setOpacity(lg.getOpacity());
          });
        }
      },

      zoomIn: function () {
        service._map.setZoom(service._map.getZoom() + 1);
      },

      zoomOut: function () {
        service._map.setZoom(service._map.getZoom() - 1);
      },

      /**
       * Initializes map layers for every layergroup.mapLayers.
       * @param  {object} timeState used to set an initial time on layers
       */
      initializeLayers: function (timeState) {
        angular.forEach(DataService.layerGroups, function (lg, lgSlug) {
          this.initializeLayer(lg);
        }, this);
      },

      initializeLayer: function (lg) {
        sortLayers(lg.mapLayers);
        angular.forEach(lg.mapLayers, function (layer, lSlug) {
          if (layer.tiled) {
            layer._leafletLayer = initializers[layer.format](layer);
            angular.extend(layer, NxtMapLayer);
          } else if (layer.format === 'WMS') {
            layer = NxtNonTiledWMSLayer.create(layer);
          }
        });
      }

    };



    /**
     * @function
     * @memberOf map.MapService
     * @param  {array} Array of nxt layers
     * @return {array} Array of object sorted by property loadOrder in
     *                 descending order.
     * @description Sorts layers by descending loadOrder
     */
    var sortLayers = function (layers) {
      layers.sort(function (a, b) {
        if (a.loadOrder > b.loadOrder) {
          return -1;
        }
        if (a.loadOrder < b.loadOrder
          || a.loadOrder === null) {
          return 1;
        }
        // a must be equal to b
        return 0;
      });
      return layers;
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {object} map Leaflet map to add layers to
     * @param  {array} Array of nxt layers
     * @param  {int} i index to start from
     * @description Adds the layers with the loadorder of layers[i]. Catches
     *              the returned promises and calls itself with the nxt index.
     *              When all layers are loaded it adds a listener to the last
     *              layer with the highest loadOrder.
     */
    var addLayersRecursively = function (map, layers, i) {
      var currentLoadOrder = layers[i].loadOrder;
      // Wrap contains the promises and the nxt index.
      var wrap = loadLayersByLoadOrder(map, layers, i, currentLoadOrder);
      // If there is more, wait for these layers to resolve
      // and start over with the remaining layers.
      if (wrap.i < layers.length) {
        startOverWhenDone(wrap.promises, map, layers, wrap.i);
      }
      // When done, add listener to the last layer with the max loadOrder
      // that is drawn on the map.
      else if (layers.length > 1) {
        var index = getIndexOfLeadingLayer(layers);
        if (typeof(index) === 'number') {
          addLoadListenersToLayer(map, layers, index);
        }
      }
    };


    /**
     * @function
     * @memberOf map.MapService
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @param  {inte} loadOrder Current load order to add layers.
     * @return {object} next index and list of promises that resolve when layer
     *                       is fully loaded.
     * @description Adds the layers from index i with the given loadorder to the
     *              map. Returns the current index and a list of promises for
     *              all the added layers when a layer with a lower loadorder is
     *              found.
     */
    var loadLayersByLoadOrder = function (map, layers, i, loadOrder) {
      // Add all layers with the current load order
      var promises = [];
      while (i < layers.length
        && layers[i].loadOrder === loadOrder) {
        promises.push(layers[i].add(map));
        i++;
      }
      return {
        i: i,
        promises: promises
      };
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {array} layers Array of nxt layers.
     * @return {int} Index of the last layer with the highest loadOrder.
     * @description Loops through the sorted layers and returns the index of the
     *              last layer in the array with the highest loadOrder.
     */
    var getIndexOfLeadingLayer = function (layers) {
      var index;
      var highestLoadingOrder = 0;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].tiled
          && (layers[i].loadOrder > highestLoadingOrder
          || layers[i].loadOrder === highestLoadingOrder)) {
          index = i;
          highestLoadingOrder = index;
        }
      }
      return index;
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {array} Array of promises.
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Takes a list of promises and calls addLayersRecursively when
     *              all promises have resolved.
     */
    var startOverWhenDone = function (promises, map, layers, i) {
      $q.all(promises).then(function () {
        addLayersRecursively(map, layers, i);
      });
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Adds listeners that call when load starts and finished to
     *              the layer at index i of layers. Callbacks remove layers of
     *              the map after index i when load starts and adds layers after
     *              index i recursively when load finishes.
     */
    var addLoadListenersToLayer = function (map, layers, i) {
      var layer = layers[i];
      var j = i + 1;

      var removeAllAfterI = function () {
        for (j; j < layers.length; j++) {
          layers[j].remove(map);
        }
      };

      var reAdd = function () {
        addLayersRecursively(map, layers, i + 1);
      };

      layer._leafletLayer.off('load');
      layer._leafletLayer.off('loading');
      layer._leafletLayer.on('loading', removeAllAfterI);
      layer._leafletLayer.on('load', reAdd);
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {dynamic} mapElem can be string or Element.
     * @param  {options} Options (bounds, attribution etc.)
     * @return {L.NxtMap}   Leaflet.NxtMap instance
     * @description Creates a Leaflet map based on idString or Element.
     */
    var createLeafletMap = function (mapElem, options) { // String or Element.

      var leafletMap = LeafletService.map(mapElem, options);

      return leafletMap;
    };

    /**
     * Initializers for every layer format
     */
    var initializers = {

      TMS: function (nonLeafLayer) {

        var layerUrl = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}{retina}.{ext}';

        // Mapbox layers support retina tiles, our own do not yet. Check whether
        // tiles are from mapbox source.
        var retinaSupport = /mapbox.tiles/g.test(nonLeafLayer.url);

        var layer = LeafletService.tileLayer(
          layerUrl, {
            retina: retinaSupport && L.Browser.retina ? '@2x' : '',
            slug: nonLeafLayer.slug,
            minZoom: nonLeafLayer.min_zoom || 0,
            maxZoom: 19,
            detectRetina: retinaSupport,
            zIndex: nonLeafLayer.zIndex,
            ext: 'png'
          });

        return layer;
      },

      WMS: function (nonLeafLayer) {
        var _options = {
          layers: nonLeafLayer.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: nonLeafLayer.min_zoom || 0,
          maxZoom: 19,
          crs: LeafletService.CRS.EPSG3857,
          opacity: nonLeafLayer.opacity,
          zIndex: nonLeafLayer.zIndex
        };
        _options = angular.extend(_options, nonLeafLayer.options);

        return LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
      },

      UTFGrid: function (nonLeafLayer) {

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        var layer = new LeafletService.UtfGrid(url, {
          ext: 'grid',
          slug: nonLeafLayer.slug,
          name: nonLeafLayer.slug,
          useJsonP: false,
          minZoom: nonLeafLayer.min_zoom_click || 0,
          maxZoom: 19,
          order: nonLeafLayer.zIndex,
          zIndex: nonLeafLayer.zIndex
        });
        return layer;
      },

      Vector: function (nonLeafLayer) {
        var leafletLayer = new LeafletVectorService({
          slug: nonLeafLayer.slug,
          color: nonLeafLayer.color,
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
                    + nonLeafLayer.color + '" />'
                    + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="'
                    + (pxSize - 2) + '" fill-opacity="1" fill="'
                    + nonLeafLayer.color + '" />'
                    + '<text x="' + pxSize + '" y="' + (pxSize + 5)
                    + '" style="text-anchor: middle; fill: white;">'
                    + size + '</text>'
                    + '</svg>'
            });
          }

        });
        return leafletLayer;
      }

    };

    return service;
  }]);
