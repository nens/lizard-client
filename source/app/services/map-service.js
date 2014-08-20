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
app.service('MapService', ['LeafletService', function (LeafletService) {
  var _map, createLayer, _initiateTMSLayer, _initiateWMSLayer,
      _initiateAssetLayer,
      addLayer, removeLayer, createMap;

  /**
   * @function
   * @memberof app.MapService
   * @param  {dynamic} mapElem can be string or Element.
   * @return {L.Map}   Leaflet.Map instance
   * @description Creates a Leaflet map based on idString or Element.
   */
  createMap = function (mapElem) { // String or Element.
    _map = LeafletService.map(mapElem);
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
    nonLeafLayer.leafletLayer = layer;
    nonLeafLayer.initiated = true;
    return layer;
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
        minZoom: nonLeafLayer.min_zoom,
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
    return layer;
  };

  /**
   * @function
   * @memberof app.MapService
   * @param  {object} nonLeafLayer as served from backend
   * @return {L.UtfGrid} utfgrid 
   * @description Initiates layers that deliver interaction with the map
   */
  _initiateGridLayer = function (nonLeafLayer) {
    var layer = new LeafletService.UtfGrid(nonLeafLayer, {
      ext: 'grid',
      slug: nonLeafLayer.slug,
      name: nonLeafLayer.slug,
      useJsonP: false,
      minZoom: nonLeafLayer.min_zoom_click,
      maxZoom: 19,
      order: nonLeafLayer.z_index,
      zIndex: nonLeafLayer.z_index
    });
    nonLeafLayer.grid_layer = nonLeafLayer;
    nonLeafLayer.initiated = true;
    return layer;
  }

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
      _initiateTMSLayer(nonLeafLayer);
      _initiateGridLayer(nonLeafLayer);
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

  return {
    createMap: createMap,
    createLayer: createLayer,
    addLayer: addLayer,
    removeLayer: removeLayer
  } 
}]);