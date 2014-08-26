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
app.service('MapService', ['$rootScope', '$filter', '$http', 'CabinetService','LeafletService', 
  function ($rootScope, $filter, $http, CabinetService, LeafletService) {

      // private
  var _map, createLayer, _initiateTMSLayer, _initiateWMSLayer,
      _initiateAssetLayer, _turnOffAllOtherBaselayers, _rescaleElevation,
      _getActiveTemporalLayer, _getLayersByType, _clicked, _updateOverLayers,
      _moveEnded, _moveStarted, _mouseMoved, _dragEnded,

      // public
      setView, fitBounds, mapState, initiateMapEvents,
      addLayer, removeLayer, createMap, toggleLayer;

  /**
   * @function
   * @memberof app.MapService
   * @param  {dynamic} mapElem can be string or Element.
   * @param  {options} Options (bounds, attribution etc.)
   * @return {L.Map}   Leaflet.Map instance
   * @description Creates a Leaflet map based on idString or Element.
   */
  createMap = function (mapElem, options) { // String or Element.
    _map = LeafletService.map(mapElem, {
      zoomControl: false,
      zoom: 12
    });

    if (options) {
      _map.fitBounds(LeafletService.latLngBounds(
        LeafletService.latLng(options.bounds.south, options.bounds.west),
        LeafletService.latLng(options.bounds.north, options.bounds.east)));

      _map.attributionControl.addAttribution(options.attribution);
      _map.attributionControl.setPrefix('');
    }
    return _map;
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
        minZoom: (nonLeafLayer.min_zoom) ? nonLeafLayer.min_zoom: NaN,
        maxZoom: 19,
        detectRetina: true,
        zIndex: nonLeafLayer.z_index
      });
    if (!nonLeafLayer.baselayer && nonLeafLayer.type == 'ASSET') {
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
        minZoom: (nonLeafLayer.min_zoom) ? nonLeafLayer.min_zoom: NaN,
        maxZoom: 19,
        zIndex: nonLeafLayer.z_index
      };
    if (nonLeafLayer.slug == 'landuse') {
      _options.styles = 'landuse';
    } else if (nonLeafLayer.slug == 'elevation') {
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
      minZoom: (nonLeafLayer.min_zoom_click) ? nonLeafLayer.min_zoom_click : NaN,
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
    switch (nonLeafLayer.type){
    case ('TMS'):
      _initiateTMSLayer(nonLeafLayer);
      break;
    case ('WMS'):
      _initiateWMSLayer(nonLeafLayer);
      break;
    case ('ASSET'):
      _initiateGridLayer(nonLeafLayer);
      _initiateTMSLayer(nonLeafLayer);
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
    } else if (layer.options.ext !== 'grid'){
      // console.warn('layer not added to the map', layer);
    }
  };

  /**
   * @function
   * @description legacy function from map-directive
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

  _updateOverLayers = function (layers) {
    var numLayers = 1;
    angular.forEach(layers, function (layer) {
      if ((layer.overlayer === true) && (layer.active)) {
        numLayers++;
      }
    });
    angular.forEach($filter('orderBy')(layers, 'z_index', true), function (layer) {
      if ((layer.overlayer === true) && (layer.active)) {
        layer.leafletLayer.setOpacity(1 / numLayers);
        numLayers--;
      }
    });
  };

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
      layers.elevation.leafletLayer.setParams({styles: styles}, true);
      layers.elevation.leafletLayer.redraw();
    });
  };

  /**
   * @function
   * @description legacy function from map-directive
   * @param  {object} layer  single layer that needs to be toggled
   * @param  {object} layers all layers to switch off.
   */
  toggleLayer = function (layer, layers) {
    if (layer.baselayer){
      _turnOffAllOtherBaselayers(layer.id, layers);
      if (!layer.active) { layer.active = true; }
      else if (layer.slug == 'elevation' && layer.active) {
        _rescaleElevation()
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
   * @description sets leaflet View based on panZoom
   * @param {object} panZoom Hashtable with, lat, lng, zoom
   */
  setView = function (panZoom) {
    _map.setView(new LeafletService.LatLng(
      panZoom.lat, panZoom.lng), panZoom.zoom);
  };

  /**
   * @function
   * @description fits leaflet to extent
   * @param  {array} extent Array with NW, NE, SW,SE
   */
  fitBounds = function (extent) {
    _map.fitBounds(extent);
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Retrieves the (single) currently active layer which has a temporal
   * component. Returns undefined if no temporal raster layer is
   * currently active.
   *
   * @return {Object}
   */
  _getActiveTemporalLayer = function () {

    var i, temporalLayers = this.getLayersByType('temporal');

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
        for (i in this.layers) {
          if (this.layers[i].baselayer && !this.layers[i].temporal) {
            result.push(this.layers[i]);
          }
        }
        break;

      case 'over':
        for (i in this.layers) {
          if (!(this.layers[i].baselayer || this.layers[i].temporal)) {
            result.push(this.layers[i]);
          }
        }
        break;

      case 'temporal':
        for (i in this.layers) {
          if (this.layers[i].temporal) {
            result.push(this.layers[i]);
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
   * @memberOf app.MapService
   * @type {Object}
   * @description mapState is the mother of everything spatial.
   * This is a central collection of the state the map is in.
   */
  mapState = {
    here: null,
    layers: CabinetService.layers,
    activeLayersChanged: false,
    eventTypes: CabinetService.eventTypes,
    changed: Date.now(),
    moved: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false,
    bounds: null,
    here: null, // Leaflet point object describing a users location of interest
    userHere: null, // Geographical location of the users mouse
    geom_wkt: '',
    mapMoving: false,
    getActiveTemporalLayer: _getActiveTemporalLayer,
    getLayersByType: _getLayersByType
  };

  /**
   * @function
   * @memberof app.MapService
   * @description changelayer function... legacy?
   * @param  {object} layer Layer object
   */
  mapState.changeLayer = function (layer) {

    if (layer.temporal) {

      mapState.activeLayersChanged =
        !mapState.activeLayersChanged;
      layer.active = !layer.active;

      // toggle timeline if neccesary
      if (timeState.hidden !== false) {
        toggleTimeline();
      }

    } else {

      // for other than temporalRaster layers, we do stuff the old way
      toggleLayer(layer, mapState.layers, mapState.bounds);
      mapState.activeLayersChanged =
        !mapState.activeLayersChanged;
    }
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

  _moveStarted = function () {
    mapState.mapMoving = true;
  };

  _mouseMoved = function (e) {
    mapState.userHere = e.latlng;
  };

  _moveEnded = function () {
    var finalizeMove = function () {
      mapState.moved = Date.now();
      mapState.mapMoving = false;
      mapState.pixelCenter = _map.getPixelBounds().getCenter();
      mapState.zoom = _map.getZoom();
      mapState.bounds = _map.getBounds();
    };

    if (!$rootScope.$$phase) {
      $rootScope.$apply(finalizeMove);
    } else {
      finalizeMove();
    }
  };

  _dragEnded = function () {
    // TODO: find solution for this

    // if (scope.box.type === 'default') {
    // // scope.box.type = 'empty';
    //   scope.$apply(function () {
    //     scope.box.close();
    //   });
    // }
    // if (scope.box.type === 'intersecttool') {
    //   scope.$apply(function () {
    //     scope.box.type = 'empty';
    //   });
    // }
  }

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
    _map.on('dragend', _dragEnded);
    // fill mapState
    _moveEnded();
  };


  return {
    mapState: mapState,
    createMap: createMap,
    createLayer: createLayer,
    addLayer: addLayer,
    removeLayer: removeLayer,
    toggleLayer: toggleLayer,
    setView: setView,
    fitBounds: fitBounds,
    initiateMapEvents: initiateMapEvents,
    mapState: mapState
  } 
}]);