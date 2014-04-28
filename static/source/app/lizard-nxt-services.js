var services = angular.module("lizard-nxt.services", []);

services.factory('BookmarkService', function($q, $rootScope) {
  return {};
});

services.service("CabinetService", ["Restangular",
  function (Restangular, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;
  var overlayers = window.overLayers;
  var eventTypes = [
    {
      "name": "Twitter",
      "event_count": 4
    },
    {
      "name": "Meldingen",
      "event_count": 4
    },
    {
      "name": "Alarmen",
      "event_count": 4
    },
    {
      "name": "Aardbevingen",
      "event_count": 4
    },
    {
      "name": "Gebouwen",
      "event_count": 4
    }
  ];

  var termSearchResource,
      bboxSearchResource,
      geocodeResource,
      reverseGeocodeResource,
      eventsResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource;
  
  Restangular.setRequestSuffix('?page_size=0');
  // termSearchResource = $resource('/api/v1/search/',{isArray: true});
  // bboxSearchResource = $resource('/api/v1/search/',{isArray: true});
  geocodeResource = Restangular.one('api/v1/geocode/');
  reverseGeocodeResource = Restangular.one('api/v1/reversegeocode/');
  timeseriesResource = Restangular.one('api/v1/timeseries/');
  eventsResource = Restangular.one('api/v1/events/', {
    type: '@event_type',
    sub_type: '@event_subtype',
    start: '@start',
    end: '@end',
    extent: '@extent'
  }, {
    get: {
      method: 'GET',
      isArray: true
    }
  });
  var rasterResource = Restangular.one('api/v1/rasters/');

  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    overlayers: overlayers,
    eventTypes: eventTypes,
    // termSearch: termSearchResource,
    // bboxSearch: bboxSearchResource,
    geocode: geocodeResource,
    raster: rasterResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    events: eventsResource,
    panZoom: null
  };
}]);
