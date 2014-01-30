var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("CabinetService", ["$resource",
  function ($resource, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;
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
  
  termSearchResource = $resource('/api/v1/search/', {isArray: true});
  bboxSearchResource = $resource('/api/v1/search/', {isArray: true});
  geocodeResource = $resource('/api/v1/geocode/');
  reverseGeocodeResource = $resource('/api/v1/reversegeocode/');
  timeseriesLocationObjectResource = $resource('/api/v1/timeseries/?object=:object_type$:id&page_size=0', {
    object_type: '@object_type',
    id: '@id',
  }, {
    get: {
      method: 'GET',
      isArray: true
    }
  });
  timeseriesResource = $resource('/api/v1/timeseries/:id/', {
    id: '@id',
    start: '@start',
    end: '@end'
  });
  eventsResource = $resource('api/v1/events/', {
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

  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    eventTypes: eventTypes,
    termSearch: termSearchResource,
    bboxSearch: bboxSearchResource,
    geocode: geocodeResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    timeseriesLocationObject: timeseriesLocationObjectResource,
    events: eventsResource,
    panZoom: null
  };
}]);
