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
.service('MapService',
        ['$rootScope', 'CabinetService', 'LeafletService', 'NxtRegionsLayer',
         'UtfGridService', 'baselayer', 'eventseriesMapLayer', 'State',
  function ($rootScope, CabinetService, LeafletService, NxtRegionsLayer,
          UtfGridService, baselayer, eventseriesMapLayer, State) {

    var topography = 'https://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa98k8k';
    var satellite = 'https://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa79205';
    var neutral = 'https://{s}.tiles.mapbox.com/v3/nelenschuurmans.l15e647c';

    var service = {

      _map: {}, // exposure is legacy, we should not mingle with the leaflet
                // map instance outside of the map component.

      /**
       * Removes all layers from map and calls remove on map which detaches all
       * events.
       */
      remove: function () {
        service.mapLayers.forEach(
          function (mapLayer) { mapLayer.remove(service._map); }
        );
        service.baselayers.forEach(
          function (baselayer) { baselayer.remove(service._map); }
        );
        if (service.annotationsLayer) {
          service.annotationsLayer.remove(service._map);
        }
        service._map.remove();
      },

      mapLayers: [],

      baselayers: [
        baselayer({ id: 'topography', url: topography, zIndex: -1 }),
        baselayer({ id: 'satellite', url: satellite, zIndex: -1 }),
        baselayer({ id: 'neutral', url: neutral, zIndex: -1 }),
      ],

      /**
       * Initializes the map service
       * @param  {DOMelement} element      used by leaflet as the map container.
       * @param  {object} mapOptions       passed to leaflet for the map
       * @param  {object} eventCallbackFns used on leaflet map events [onmove etc]
       */
      initializeMap: function (element, mapOptions, eventCallbackFns, layers) {
        service._map = createLeafletMap(element, mapOptions);
        this._initializeNxtMapEvents(eventCallbackFns);
      },

      updateLayers: function (layers, rebuildTMS) {
        var mapLayer;
        layers.forEach(function (layer) {
          mapLayer = _.find(service.mapLayers, { uuid: layer.uuid });
          if (mapLayer) {
            if (layer.active) {
              mapLayer.update(service._map, State.temporal, layer, rebuildTMS);
            } else {
              mapLayer.remove(service._map, layer);
            }
          }
        });
      },

      updateAssetGroups: function (layers) {
        service.updateLayers(layers, true);
      },

      updateBaselayers: function () {
        service.baselayers.forEach(function (baselayer) {
          if (baselayer.id === State.baselayer) {
            baselayer.update(service._map);
          } else {
            baselayer.remove(service._map);
          }
        });
      },

      updateAnnotations: function () {
        if (!service.annotationsLayer) { return; }
        if (State.annotations.active) {
          service.annotationsLayer.update(service._map, State.temporal);
        } else {
          service.annotationsLayer.remove(service._map);
        }
      },

      rescaleLayer: function (layer) {
        var bounds = service._map.getBounds();
        var mapLayer = _.find(service.mapLayers, { uuid: layer.uuid });
        mapLayer.rescale(bounds);
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
            service._map.fitBounds.apply(service._map, arguments);
          }
          else if (bounds.hasOwnProperty('_southWest')
            && bounds.hasOwnProperty('_northEast')) {
            service._map.fitBounds(L.latLngBounds(
              L.latLng(bounds._southWest),
              L.latLng(bounds._northEast)));
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
       * Returns pixel size of map.
       */
      getSize: function () {
        return service._map.getSize();
      },

      /**
       * Convert GeoJson geometry to pixel position on the map.
       */
      gJPointToMapPoint: function (gj) {
        if (gj.geometry) {
          gj = gj.geometry;
        }
        if (gj.type === 'Point') {
          return service._map.latLngToContainerPoint(
            L.latLng(gj.coordinates[1], gj.coordinates[0])
          );
        }
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

      getDataFromUtfLayers: function (latLng, onResponse, onNoResponse) {
        var assetGroups = _.filter(State.layers, {type: 'assetgroup', active: true});
        var count = 0;
        if (assetGroups.length === 0) {
          onNoResponse();
        }
        else {
          assetGroups.forEach(function (assetGroup) {
            var utfLayer = _.find(service.mapLayers, {uuid: assetGroup.uuid}).utf;
            UtfGridService.getData(utfLayer, {'geom': latLng})
            .then(function (response) {
              if (response) {
                onResponse(response);
              }
              else if (count++ === assetGroups.length - 1) {
                onNoResponse();
              }
            });
          });
        }
      },

      _setAssetOrGeomFromUtfOnState: function (latLng) {
        State.selected.assets = [];
        State.selected.geometries = [];
        service.getDataFromUtfLayers(
          latLng,
          function (data) {
            // Create one entry in selected.assets.
            var assetId = data.entity_name + '$' + data.id;
            State.selected.assets = [assetId];
            State.selected.geometries = [];
          },
          function () {
            State.selected.assets = [];
            service._setGeomFromUtfToState(latLng);
          }
        );
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
        service.getDataFromUtfLayers(
          latLng,
          function (data) {
            // Create one entry in selected.assets.
            var assetId = data.entity_name + '$' + data.id;
            if (service._isUniqueAssetId(State.selected.assets, assetId)) {
              State.selected.assets.addAsset(assetId);
            }
          },
          function () {
            service._addGeomFromUtfToState(latLng);
          }
        );
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
        if (State.box.type === 'point') {
          service._setAssetOrGeomFromUtfOnState(latLng);
        }

        else if (State.box.type === 'multi-point') {
          service._addAssetOrGeomFromUtfOnState(latLng);
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

      vectorClickCb: function (layer, clearGeometries) {
        for (var key in layer.feature.properties) {
          var newkey = key === 'type' ? 'regionType' : key;
          layer.feature[newkey] = layer.feature.properties[key];
        }
        layer.feature.properties = {};
        State.selected.geometries = []; // empty first.
        if (clearGeometries)
          return;
        State.selected.geometries = [layer.feature];
      },

      getRegions: function () {

        /**
         * Callback for clicks on regions. Calls fillRegion.
         *
         * @param  {object} leaflet ILayer that recieved the click.
         */
        var clickCb = service.vectorClickCb;

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
        map.on('moveend', function (e) { conditionalApply(cbs.onMoveEnd, e); });
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

      zoomIn: function () {
        service._map.setZoom(service._map.getZoom() + 1);
      },

      zoomOut: function () {
        service._map.setZoom(service._map.getZoom() - 1);
      },

      getLeafletLayer: function (id) {
        return service._map._layers[id];
      }

    };

    Object.defineProperty(service, 'loading', {
      get: function () { return _.some(service.mapLayers, {loading: true}); }
    });

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
