'use strict';

/**
 * @ngdoc service
 * @class MapService
 * @memberof app
 * @name MapService
 * @requires LeafletService
 * @summary Wraps stuff around Leaflet Map objects
 * @description  Map service encapsulates all kinds of helper functions
 * for the map-directive. A wrapper of sorts for Leaflet stuff,
 * the map object and mapState.
 *
 */
app.service('MapService', ['$rootScope', '$filter', '$http', 'CabinetService',
                           'LeafletService',
  function ($rootScope, $filter, $http, CabinetService, LeafletService) {

      // private vars
  var _map, createLayer, _initiateTMSLayer, _initiateWMSLayer,
      _initiateAssetLayer, _turnOffAllOtherBaselayers, _rescaleElevation,
      _getActiveTemporalLayer, _getLayersByType, _clicked, _updateOverLayers,
      _moveEnded, _moveStarted, _mouseMoved, _dragEnded, _initiateGridLayer,
      _initiated,

      // public vars
      setView, fitBounds, mapState, initiateMapEvents, getLayer, latLngToLayerPoint,
      newGeoJsonLayer, addLayer, removeLayer, createMap, toggleLayer;

  /**
   * @function
   * @memberof app.MapService
   * @param  {dynamic} mapElem can be string or Element.
   * @param  {options} Options (bounds, attribution etc.)
   * @return {L.Map}   Leaflet.Map instance
   * @description Creates a Leaflet map based on idString or Element.
   */
  createMap = function (mapElem, options) { // String or Element.

    var bounds = L.latLngBounds(
      L.latLng(data_bounds.all.south, data_bounds.all.east),
      L.latLng(data_bounds.all.north, data_bounds.all.west));

    _map = LeafletService.map(mapElem, {
      zoomControl: false,
      zoom: 12,
      center: bounds.getCenter()
    });

    if (options) {
      _map.fitBounds(bounds);

      _map.attributionControl.addAttribution(options.attribution);
      _map.attributionControl.setPrefix('');
    }

    mapState.initiated = true;
    return _map;
  };

  var isMapDefined = function () {
    return !!_map;
  };

  /**
   * @function
   * @memberof app.MapService
   * @param  {object} layer as served from backend
   * @return {L.TileLayer} leafletLayer
   * @description Initiates a Leaflet Tilelayer
   */
  _initiateTMSLayer = function (nonLeafLayer) {
    var layer = LeafletService.tileLayer(
      nonLeafLayer.url + '.png', {
        name: (nonLeafLayer.baselayer) ? 'Background': nonLeafLayer.slug,
        slug: nonLeafLayer.slug,
        minZoom: (nonLeafLayer.min_zoom) ? nonLeafLayer.min_zoom: 0,
        maxZoom: 19,
        detectRetina: true,
        zIndex: nonLeafLayer.z_index
      });
    if (!nonLeafLayer.baselayer && nonLeafLayer.type === 'ASSET') {
      layer._url = nonLeafLayer.url;
      layer.options.ext = 'png';
    }
    nonLeafLayer.leafletLayer = layer;
    nonLeafLayer.initiated = true;
  };

  /**
   * @function
   * @memberof app.MapService
   * @param  {object} nonLeafLayer as served from backend
   * @return {L.TileLayer.WMS}              [description]
   * @description Initiates a Leaflet WMS layer
   */
  _initiateWMSLayer = function (nonLeafLayer) {
    var layer, _options;
    _options = {
        layers: nonLeafLayer.slug,
        format: 'image/png',
        version: '1.1.1',
        minZoom: (nonLeafLayer.min_zoom) ? nonLeafLayer.min_zoom: 0,
        maxZoom: 19,
        zIndex: nonLeafLayer.z_index
      };
    if (nonLeafLayer.slug === 'landuse') {
      _options.styles = 'landuse';
    } else if (nonLeafLayer.slug === 'elevation') {
      _options.styles = 'BrBG_r';
      _options.effects = 'shade:0:3';
    } else if (nonLeafLayer.slug === 'isahw:BOFEK2012') {
      return; // Add no styling for soil layer
    } else { // Default, used by zettingsvloeiingsproef
      _options.styles = 'BrBG_r';
      _options.effects = 'shade:0:3';
    }
    layer = LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
    nonLeafLayer.leafletLayer = layer;
    nonLeafLayer.initiated = true;
  };

  /**
   * @function
   * @memberof app.MapService
   * @param  {object} nonLeafLayer as served from backend
   * @return {L.UtfGrid} utfgrid
   * @description Initiates layers that deliver interaction with the map
   */
  _initiateGridLayer = function (nonLeafLayer) {
    var layer = new L.UtfGrid(nonLeafLayer.url, {
      ext: 'grid',
      slug: nonLeafLayer.slug,
      name: nonLeafLayer.slug,
      useJsonP: false,
      minZoom: (nonLeafLayer.min_zoom_click) ?
        nonLeafLayer.min_zoom_click : 0,
      maxZoom: 19,
      order: nonLeafLayer.z_index,
      zIndex: nonLeafLayer.z_index
    });
    nonLeafLayer.grid_layer = layer;
    nonLeafLayer.initiated = true;
  };

  /**
   * @function
   * @memberof app.MapService
   * @param  {object} nonLeafLayer object from database
   * @description Throw in a layer as served from the backend
   */
  createLayer = function (nonLeafLayer) {
    // temporal layers should not be added to the map.
    if (nonLeafLayer.temporal) { return; }

    switch (nonLeafLayer.type) {
    case ('TMS'):
      _initiateTMSLayer(nonLeafLayer);
      break;
    case ('WMS'):
      _initiateWMSLayer(nonLeafLayer);
      break;
    case ('Vector'):
      break;
    case ('ASSET'):
      _initiateGridLayer(nonLeafLayer);
      _initiateTMSLayer(nonLeafLayer);
      break;
    case ('Vector'):
      break;
    default:
      _initiateTMSLayer(nonLeafLayer);
      break;
    }
  };

  /**
   * @function
   * @memberof app.MapService
   * @param {L.Class} Leaflet layer.
   * @description Adds layer to map
   */
  addLayer = function (layer) { // Leaflet Layer
    if (layer instanceof L.Class) {
      _map.addLayer(layer);
    } else {
      console.warn('layer not of type L.Class', layer);
    }
  };

  /**
   * @function
   * @memberof app.MapService
   * @param  {L.Class} Leaflet layer
   * @description Removes layer from map
   */
  removeLayer = function (layer) { // Leaflet Layer
    if (_map.hasLayer(layer)) {
      _map.removeLayer(layer);
    }
  };

  /**
   * @function
   * @description legacy function from map-directive
   * turns of all active baselayers.
   * @param  {string} id     id for layer.
   * @param  {object} layers
   */
  _turnOffAllOtherBaselayers = function (id, layers) {
    angular.forEach(layers, function (i) {
      if (i.baselayer && i.id !== id && i.active) {
        i.active = false;
        removeLayer(i.leafletLayer);
      }
    });
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Updates opacity of different layers
   * @param  {layersObject}
   */
  _updateOverLayers = function (layers) {
    var numLayers = 1;
    angular.forEach(layers, function (layer) {
      if ((layer.overlayer === true) && (layer.active)) {
        numLayers++;
      }
    });
    angular.forEach($filter('orderBy')(layers, 'z_index', true),
      function (layer) {
      if ((layer.overlayer === true) && (layer.active) &&
          'leafletLayer' in layer) {
        layer.leafletLayer.setOpacity(1 / numLayers);
        numLayers--;
      }
    });
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Elevation can be rescaled according to extent
   */
  _rescaleElevation = function () {
    var url, bounds, limits, styles;
    bounds = _map.getBounds();
    // Make request to raster to get min and max of current bounds
    url = 'https://raster.lizard.net/wms' +
              '?request=getlimits&layers=elevation' +
              '&width=16&height=16&srs=epsg:4326&bbox=' +
              bounds.toBBoxString();
    $http.get(url).success(function (data) {
      limits = ':' + data[0][0] + ':' + data[0][1];
      styles = 'BrBG_r' + limits;
      CabinetService.layers.elevation.leafletLayer.setParams(
        {styles: styles}, true);
      CabinetService.layers.elevation.leafletLayer.redraw();
    });
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description legacy function from map-directive --> does too much!
   * @param  {object} layer  single layer that needs to be toggled
   * @param  {object} layers all layers to switch off.
   */
  toggleLayer = function (layer, layers) {
    // if (!layer.initiated) { return; }
    if (layer.baselayer) {
      _turnOffAllOtherBaselayers(layer.id, layers);
      if (!layer.active) { layer.active = true; }
      else if (layer.slug === 'elevation' && layer.active) {
        _rescaleElevation();
      }
    } else {
      layer.active = !layer.active;
    }

    if (layer.active) {
      addLayer(layer.leafletLayer);
      if (layer.grid_layer) {
        layer.leafletLayer.on('load', function () {
          addLayer(layer.grid_layer);

          layer.grid_layer.on('load', function () {
            // Broadcast a load finished message to a.o. aggregate-directive
            $rootScope.$broadcast(layer.slug + 'GridLoaded');
          });
        });
        layer.leafletLayer.on('loading', function () {
          // Temporarily remove all utfLayers for performance
          removeLayer(layer.grid_layer);
        });
      }
    } else {
      removeLayer(layer.leafletLayer);
      if (layer.grid_layer) {
        removeLayer(layer.grid_layer);
      }
    }


    if (layer.overlayer) {
      _updateOverLayers(layers);
    }
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Get layer from leaflet map object.
   *
   * Because leaflet doesn't supply a map method to get a layer by name or
   * id, we need this crufty function to get a layer.
   *
   * NOTE: candidate for (leaflet) util module
   *
   * @layerType: layerType, type of layer to look for either `grid`, `png`
   * or `geojson`
   * @param: entityName, name of ento
   * @returns: leaflet layer object or false if layer not found
   */
  getLayer = function (layerType, entityName) {

    var k, opts;

    for (k in _map._layers) {
      opts = _map._layers[k].options;
      if (opts.name === entityName && opts.ext === layerType) {
        return _map._layers[k];
      }
    }
    return false;
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description wrapper for leaflet function.
   * @return {L.GeoJson} empty geojson layer.
   */
  newGeoJsonLayer = function () {
    return LeafletService.geoJson();
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description sets leaflet View based on panZoom
   * @param {object} panZoom Hashtable with, lat, lng, zoom
   */
  setView = function (panZoom) {
    if (panZoom.hasOwnProperty('lat') &&
        panZoom.hasOwnProperty('lng') &&
        panZoom.hasOwnProperty('zoom')) {
      _map.setView(new LeafletService.LatLng(
        panZoom.lat, panZoom.lng), panZoom.zoom);
    } else {
      _map.setView.apply(_map, arguments);
    }
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description fits leaflet to extent
   * @param  {array} extent Array with NW, NE, SW,SE
   */
  fitBounds = function (extent) {
    _map.fitBounds(extent);
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Retrieves the (single) currently active layer which has a
   * temporal component. Returns undefined if no temporal raster layer is
   * currently active.
   *
   * @return {Object}
   */
  _getActiveTemporalLayer = function () {

    var i, temporalLayers = _getLayersByType('temporal');
    for (i = 0; i < temporalLayers.length; i++) {
      if (temporalLayers[i].active) {
        return temporalLayers[i];
      }
    }
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Retrieves layers by type (base | over | temporal). Used for
   * keeping the right-hand menu readable.
   *
   * @param {string} layerType A string representation of the
   *                           three possible layer types.
   * @return {Object[]}
   */
  _getLayersByType = function (layerType) {

    var attr, i, result = [];

    switch (layerType) {
    case 'base':
      for (i in CabinetService.layers) {
        if (CabinetService.layers[i].baselayer && !CabinetService.layers[i].temporal) {
          result.push(CabinetService.layers[i]);
        }
      }
      break;

    case 'over':
      for (i in CabinetService.layers) {
        if (!(CabinetService.layers[i].baselayer || CabinetService.layers[i].temporal)) {
          result.push(CabinetService.layers[i]);
        }
      }
      break;

    case 'temporal':
      for (i in CabinetService.layers) {
        if (CabinetService.layers[i].temporal) {
          result.push(CabinetService.layers[i]);
        }
      }
      break;

    default:
      console.log('EXCEPTION-esque: tried to call getLayersByType() ' +
                  'with unknown arggument "' + layerType + '"');
    }

    return result;
  };

  /**
   * @description legacy function.
   */
  latLngToLayerPoint = function (latlng) {
    return _map.latLngToLayerPoint(latlng);
  };

  /**
   * @memberOf app.MapService
   * @type {Object}
   * @description mapState is the mother of everything spatial.
   * This is a central collection of the state the map is in.
   */
  mapState = {
    here: null,
    points: [], // History of here for drawing
    center: null,
    initiated: _initiated,
    layers: CabinetService.layers,
    activeLayersChanged: false,
    eventTypes: CabinetService.eventTypes,
    changed: Date.now(),
    moved: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false,
    bounds: null,
    userHere: null, // Geographical location of the users mouse
    geom_wkt: '',
    mapMoving: false,
    getActiveTemporalLayer: _getActiveTemporalLayer,
    getLayersByType: _getLayersByType
  };


  /**
   * Click handlers for map.
   */

  /**
   * @function
   * @memberOf app.MapService
   * @description small clickhandler for leafletclicks
   * @param  {event}  e Leaflet event object
   */
  _clicked = function (e) {
    if (e.hasOwnProperty('latlng')) {
      mapState.here = e.latlng;
    } else if (e.hasOwnProperty('e')) {
      mapState.here = e.e.latlng;
    }
    // removeLayer(mapState.clickLayer);
    // delete mapState.clickLayer;
    $rootScope.$apply();
  };

  /**
   * @function
   * @memberOf app.MapService
   */
  _moveStarted = function () {
    mapState.mapMoving = true;
  };

  /**
   * @function
   * @memberOf app.MapService
   */
  _mouseMoved = function (e) {
    if (!$rootScope.$$phase) {
      $rootScope.$apply(function () {
        mapState.userHere = e.latlng;
      });
    } else {
      mapState.userHere = e.latlng;
    }
  };

  /**
   * @function
   * @memberOf app.MapService
   */
  _moveEnded = function () {
    var finalizeMove = function () {
      mapState.moved = Date.now();
      mapState.mapMoving = false;
      mapState.center = _map.getCenter();
      mapState.zoom = _map.getZoom();
      mapState.bounds = _map.getBounds();
    };

    if (!$rootScope.$$phase) {
      $rootScope.$apply(finalizeMove);
    } else {
      finalizeMove();
    }
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Initiate map events
   * @return {void}
   */
  initiateMapEvents = function () {
    _map.on('click', _clicked);
    _map.on('movestart', _moveStarted);
    _map.on('mousemove', _mouseMoved);
    _map.on('moveend', _moveEnded);
    // fill mapState
    _moveEnded();
  };


  return {
    mapState: mapState,
    isMapDefined: isMapDefined,
    createMap: createMap,
    createLayer: createLayer,
    addLayer: addLayer,
    removeLayer: removeLayer,
    getLayer: getLayer,
    toggleLayer: toggleLayer,
    newGeoJsonLayer: newGeoJsonLayer,
    latLngToLayerPoint: latLngToLayerPoint,
    setView: setView,
    fitBounds: fitBounds,
    initiateMapEvents: initiateMapEvents,
  };
}]);
