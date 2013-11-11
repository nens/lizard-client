var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("CabinetService", ["$resource",
  function ($resource, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;

  var termSearchResource,
      bboxSearchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource;
  
  termSearchResource = $resource('/api/v1/search/',{isArray: true});
  bboxSearchResource = $resource('/api/v1/search/',{isArray: true});
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

  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    termSearch: termSearchResource,
    bboxSearch: bboxSearchResource,
    geocode: geocodeResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    timeseriesLocationObject: timeseriesLocationObjectResource,
    panZoom: null
  };
}]);
