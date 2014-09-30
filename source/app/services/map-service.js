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
                           'LeafletService', 'LayerGroup',
  function ($rootScope, $filter, $http, CabinetService,
    LeafletService, LayerGroup) {

      // private vars
  var _map, _rescaleElevation, _clicked,
      _moveEnded, _moveStarted, _mouseMoved, _dragEnded,
      _layerGroups = {};

      // public vars
  var setView, fitBounds, initiateMapEvents, latLngToLayerPoint,
      newGeoJsonLayer, createMap, toggleLayerGroup,
      createLayerGroups, setLayerGoupsToDefault;

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
    });

    // TODO: fix the relative position of nav bar and map element to make the
    // attribution visible.
    // var osmAttrib = '<a href="http://www.openstreetmap.org/">&copy; OpenStreetMap</a>';
    // _map.attributionControl.addAttribution(options.attribution);
    // _map.attributionControl.setPrefix('');
  };

  var isMapDefined = function () {
    return !!_map;
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Elevation can be rescaled according to extent
   */
  var rescaleElevation = function () {
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
   * @memberof app.MapService
   * @param  {object} nonLeafLayer object from database
   * @description Throw in a layer as served from the backend
   */
  createLayerGroups = function (serverSideLayerGroups) {
    _layerGroups = {};
    angular.forEach(serverSideLayerGroups, function (sslg) {
      _layerGroups[sslg.slug] = new LayerGroup(sslg);
    });
    return _layerGroups;
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description legacy function from map-directive --> does too much!
   * @param  {object} layer  single layer that needs to be toggled
   * @param  {object} layers all layers to switch off.
   */
  toggleLayerGroup = function (layerGroup, layerGroups) {
    if (layerGroup._slug === 'elevation' && layerGroup.isActive()) {
      rescaleElevation();
    } else {
      layerGroup.toggle(_map, layerGroup._slug);
      angular.forEach(layerGroups, function (_layerGroup) {
        if (layerGroup.baselayer) {
          if (_layerGroup.baselayer && _layerGroup !== layerGroup && _layerGroup.isActive()) {
            layerGroup.toggle(_map);
          }
        } else if (layerGroup.temporal) {
          if (_layerGroup.temporal && _layerGroup !== layerGroup && _layerGroup.isActive()) {
            layerGroup.toggle(_map);
          }
        }
      });
    }
  };

  setLayerGoupsToDefault = function () {
    angular.forEach(_layerGroups, function (layerGroup) {
      if (layerGroup.defaultActive) { layerGroup.toggle(_map); }
    });
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
        panZoom.hasOwnProperty('zoom'))
    {
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
  fitBounds = function (bounds) {
    if (!(bounds instanceof LeafletService.LatLngBounds)) {
      _map.fitBounds(L.latLngBounds(
        L.latLng(bounds.south, bounds.east),
        L.latLng(bounds.north, bounds.west)));
    } else {
      _map.fitBounds(bounds);
    }
  };

  /**
   * @description legacy function.
   */
  latLngToLayerPoint = function (latlng) {
    return _map.latLngToLayerPoint(latlng);
  };

  /**
   * @function
   * @memberOf app.MapService
   * @description Initiate map events
   * @return {void}
   */
  initiateMapEvents = function (clicked, moveStarted, moveEnded, mouseMoved)
  {
    var conditionalApply = function (fn, e) {

      if (!$rootScope.$$phase) {
        $rootScope.$apply(fn(e, _map));
      } else {
        fn(e, _map);
      }
    };

    _map.on('click', function (e) { conditionalApply(clicked, e); });
    _map.on('movestart', function (e) { conditionalApply(moveStarted, e); });
    _map.on('mousemove', function (e) { conditionalApply(mouseMoved, e); });
    _map.on('moveend', function (e) { conditionalApply(moveEnded, e); });
  };


  return {
    isMapDefined: isMapDefined,
    createMap: createMap,
    createLayerGroups: createLayerGroups,
    toggleLayerGroup: toggleLayerGroup,
    newGeoJsonLayer: newGeoJsonLayer,
    latLngToLayerPoint: latLngToLayerPoint,
    setView: setView,
    fitBounds: fitBounds,
    initiateMapEvents: initiateMapEvents,
    setLayerGoupsToDefault: setLayerGoupsToDefault
  };
}]);
