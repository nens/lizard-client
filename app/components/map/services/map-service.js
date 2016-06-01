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
.service('MapService', ['$rootScope', '$q', 'LeafletService', 'LeafletVectorService','CabinetService', 'DataService', 'temporalWmsLayer', 'NxtRegionsLayer', 'NxtMapLayer', 'State',
  function ($rootScope, $q, LeafletService, LeafletVectorService, CabinetService, DataService, temporalWmsLayer, NxtRegionsLayer, NxtMapLayer, State) {


    /**
     * Initializers for every layer format
     */
    var initializers = {

      MAXZOOMLEVEL: 21,

      tms: function (url) {

        var layerUrl = url + '/{z}/{x}/{y}{retina}.png';

        var layer = LeafletService.tileLayer(
          layerUrl, {
            retina: L.Browser.retina ? '@2x' : '',
            minZoom: 0,
            maxZoom: this.MAXZOOMLEVEL,
            detectRetina: true
          });

        return layer;
      },

      wms: function (nonLeafLayer) {
        var _options = {
          layers: nonLeafLayer.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: nonLeafLayer.minZoom || 0,
          maxZoom: nonLeafLayer.maxZoom || this.MAXZOOMLEVEL,
          crs: LeafletService.CRS.EPSG3857,
          opacity: nonLeafLayer.opacity,
          zIndex: nonLeafLayer.zIndex
        };
        _options = angular.extend(_options, nonLeafLayer.options);

        return LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
      },

      temporalwms: function (options) {
        var _options = {
          layers: options.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: options.minZoom || 0,
          maxZoom: options.maxZoom || this.MAXZOOMLEVEL,
          crs: LeafletService.CRS.EPSG3857,
          opacity: options.opacity,
          zIndex: options.zIndex
        };
        _options = angular.extend(_options, options);

        return LeafletService.tileLayer.wms(url, _options);
      },

      utf: function (nonLeafLayer) {

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        var layer = new LeafletService.UtfGrid(url, {
          ext: 'grid',
          slug: nonLeafLayer.slug,
          name: nonLeafLayer.slug,
          useJsonP: false,
          minZoom: nonLeafLayer.minZoom || 0,
          maxZoom: nonLeafLayer.maxZoom || this.MAXZOOMLEVEL,
          order: nonLeafLayer.zIndex,
          zIndex: nonLeafLayer.zIndex
        });
        return layer;
      },

      vector: function (nonLeafLayer) {
        var options = {
          layer: nonLeafLayer,
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
          },
          callbackClick: function (e, features) {
            service.spatialSelect(e.latlng);
          }
        };

        return new LeafletVectorService(options);
      }

    };

    var topography = 'http://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa98k8k';
    var sattelite = 'http://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa79205';
    var neutral = 'http://{s}.tiles.mapbox.com/v3/nelenschuurmans.l15e647c';

    var service = {

      BASELAYERS: [
        {
          name: 'Topography',
          lLayer: initializers.tms(topography)
        },
        {
          name: 'Sattelite',
          lLayer: initializers.tms(sattelite)
        },
        {
          name: 'Neutral',
          lLayer: initializers.tms(neutral)
        }
      ],

      _map: {}, // exposure is legacy, we should not mingle with the leaflet
                // map instance outside of the map component.

      remove: function () {
        service._map.remove();
      },

      /**
       * Initializes the map service
       * @param  {DOMelement} element      used by leaflet as the map container.
       * @param  {object} mapOptions       passed to leaflet for the map
       * @param  {object} eventCallbackFns used on leaflet map events [onmove etc]
       */
      initializeMap: function (element, mapOptions, eventCallbackFns) {
        service._map = createLeafletMap(element, mapOptions);
        this._initializeNxtMapEvents(eventCallbackFns);
      },

      _updateLayers: function (dataLayers, mapLayers, format) {
        dataLayers.forEach(function (layer) {
          if (layer.active) {
            service.addLeafletLayer(mapLayers[layer.slug][format]);
            mapLayers[layer.slug][format].setOpacity(layer.opacity);
          } else {
            service.removeLeafletLayer(mapLayers[layer.slug][format]);
          }
        });
      },

      updateLayers: function (layers) {

        _.forEach(service.BASELAYERS, function (layer, i) {
          if (layer.name.toLowerCase() === layers.baselayer) {
            service.addLeafletLayer(layer.lLayer);
          }
          else { service.removeLeafletLayer(layer.lLayer); }
        });

        service._updateLayers(layers.rasters, service.rasters, 'wms');
        service._updateLayers(layers.wms, service.wms, 'wms');
        service._updateLayers(layers.eventseries, service.rasters, 'vector');
        service._updateLayers(layers.assets, service.assets, 'tms');

        layers.assets.forEach(function (assetLayer) {
          if (assetLayer.active) {
            service.addLeafletLayer(service.assets[assetLayer.slug].utf);
          } else {
            service.removeLeafletLayer(service.assets[assetLayer.slug].utf);
          }
        });

      },

      /**
       * Syncs all layer groups to provided timeState object.
       * @param  {object} timeState   State.temporal object, containing start,
       *                              end, at and aggwindow.
       * @param  {object} optionalMap map object to sync the data to.
       * @return {object}             promise that resolves layergroups synced.
       */
      syncTime: function (timeState) {
        var defer = $q.defer();
        // var promises = [];
        // angular.forEach(DataService.layerGroups, function (layerGroup) {
        //   if (layerGroup.isActive()) {
        //     angular.forEach(layerGroup.mapLayers, function (layer) {
        //       var p = layer.syncTime(timeState, service._map);
        //       if (p) {
        //         promises.push(p);
        //       }
        //     });
        //   } else {
        //     angular.forEach(layerGroup.mapLayers, function (layer) {
        //       layer.timeState = timeState;
        //     });
        //   }
        // });
        // var that = this;
        // $q.all(promises).then(function () {
        //   State.layerGroups.timeIsSyncing = false;
        //   defer.resolve();
        //   return defer.promise;
        // });
        // if (promises.length > 0) {
        //   State.layerGroups.timeIsSyncing = true;
        // }
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

      line: {
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      },

      /**
       * @description legacy function.
       */
      latLngToLayerPoint: function (latlng) {
        return service._map.latLngToLayerPoint(latlng);
      },

      _setAssetOrGeomFromUtfOnState: function (latLng) {
        State.selected.assets = [];
        State.selected.geometries = [];
        DataService.utfLayerGroup.getData('dataService', {'geom': latLng})
        .then(null, null, function (response) {

          var data = response.data;
          if (response.data) {
            // Create one entry in selected.assets.
            var assetId = data.entity_name + '$' + data.id;
            State.selected.assets = [assetId];
            State.selected.geometries = [];
          }

          else {
            State.selected.assets = [];
            service._setGeomFromUtfToState(latLng);
          }
        });
      },

      _setGeomFromUtfToState: function (latLng) {
        // Create one entry in selected.geometries.
        State.selected.geometries = [{
          geometry: {
            type: 'Point',
            coordinates: [latLng.lng, latLng.lat]
          }
        }];
      },


      /**
       * @function
       * @description Checks whether asset is already in the assets container
       * @params {array} list of assets
       * @params {number} id of asset that you want to append
       */
      _isUniqueAssetId: function (assets, assetId) {
        // dedupe the shiz
        var unique = true;
        assets.filter(function (item, index) {
          if (item === assetId) {
            unique = false;
            return item;
          }
        });
        return unique;
      },

      _addAssetOrGeomFromUtfOnState: function (latLng) {

        DataService.utfLayerGroup.getData('dataService', {'geom': latLng})
        .then(null, null, function (response) {

          var data = response.data;
          if (data) {
            // Create one entry in selected.assets.
            var assetId = data.entity_name + '$' + data.id;
            if (service._isUniqueAssetId(State.selected.assets, assetId)) {
              State.selected.assets.addAsset(assetId);
            }
          }

          else {
            service._addGeomFromUtfToState(latLng);
          }
        });
      },

      _addGeomFromUtfToState: function (latLng) {
        // Create one entry in selected.geometries.
        State.selected.geometries.addGeometry({
          geometry: {
            type: 'Point',
            coordinates: [latLng.lng, latLng.lat]
          }
        });
      },

      /**
       * Callback for the map when clicked.
       * @param  {[type]} latLng [description]
       * @return {[type]}        [description]
       */
      spatialSelect: function (latLng) {
        var utfSlug;
        if (DataService.utfLayerGroup){
          utfSlug = DataService.utfLayerGroup.slug;
        }
        if (State.box.type === 'point') {
          if (State.layers.assets[0] && State.layers.assets[0].active) {
            this._setAssetOrGeomFromUtfOnState(latLng);
          }
          else {
            this._setGeomFromUtfToState(latLng);
          }
        }

        else if (State.box.type === 'multi-point') {
          if (State.layers.assets[0] && State.layers.assets[0].active) {
            service._addAssetOrGeomFromUtfOnState(latLng);
          }
          else {
            this._addGeomFromUtfToState(latLng);
          }
        }
        else if (State.box.type === 'line') {
          if (this.line.geometry.coordinates.length === 2
            || State.selected.geometries.length > 0) {
            State.selected.geometries = [];
            this.line.geometry.coordinates = [];
          }
          if (this.line.geometry.coordinates.length < 2) {
            this.line.geometry.coordinates.push([latLng.lng, latLng.lat]);
          }
          if (this.line.geometry.coordinates.length === 2) {
            State.selected.geometries.addGeometry(this.line);
          }
        }
      },

      getRegions: function () {

        /**
         * Callback for clicks on regions. Calls fillRegion.
         *
         * @param  {object} leaflet ILayer that recieved the click.
         */
        var clickCb = function (layer) {
          for (var key in layer.feature.properties) {
            var newkey = key === 'type' ? 'regionType' : key;
            layer.feature[newkey] = layer.feature.properties[key];
          }
          layer.feature.properties = {};
          State.selected.geometries = [layer.feature];
        };

       CabinetService.regions.get({
          z: State.spatial.view.zoom,
          in_bbox: State.spatial.bounds.getWest()
            + ','
            + State.spatial.bounds.getNorth()
            + ','
            + State.spatial.bounds.getEast()
            + ','
            + State.spatial.bounds.getSouth()
        })
        .then(function (regions) {
          NxtRegionsLayer.add(service, regions.results, clickCb);
        });
      },

      removeRegions: function () {
        NxtRegionsLayer.remove(this);
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
       * @param  {object} Leaflet map
       * @param  {object} Leaflet layer
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
       * @param  {object} Leaflet map
       * @param  {object} Leaflet layer
       * @description Removes layer from map
       */
      removeLeafletLayer: function (leafletLayer) { // Leaflet NxtLayer
        if (service._map.hasLayer(leafletLayer)) {
          service._map.removeLayer(leafletLayer);
        }
      },


      _toggleLayers: function (lg) {
        if (lg.isActive() && lg.mapLayers.length > 0) {
          service.syncTime(State.temporal);
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
            if (!layer.bounds) { layer.bounds = lg.spatialBounds; }
            layer = NxtNonTiledWMSLayer.create(layer);
          }
        });
      },

      getLeafletLayer: function (id) {
        return service._map._layers[id];
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
     * @param  {int} loadOrder Current load order to add layers.
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

    return service;
  }]);
