var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("CabinetService", ["$resource", "$rootScope",
  function($resource, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;

  var searchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource;
  
  searchResource = $resource('/api/v1/search/');
  geocodeResource = $resource('/api/v1/geocode/');
  reverseGeocodeResource = $resource('/api/v1/reversegeocode/');
  timeseriesLocationObjectResource = $resource('/api/v1/timeseries/:id/?location__object_type__name=:object_type&location__object_id=:object_id', {
    object_type: '@object_type',
    id: '@id',
    object_id: 1
  });
  // timeseriesResource = $resource('/api/v1/timeseries/:id/', {
  //   id: '@id'
  // });
  timeseriesResource = $resource('/static/data/tijdserie.json', {
    id: '@id'
  });


  $rootScope.$broadcast('LayersRetrieved');

  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    search: searchResource,
    geocode: geocodeResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    timeseriesLocationObject: timeseriesLocationObjectResource,
    panZoom: null
  };
}]);


services.service("Omnibox", [function() {
  var box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'empty',
    content: 'empty'
  };

  box.open = function(type){
    box.type = type;
    box.showCards = true;
  };

  box.close = function(){
    box.type = 'empty';
    box.showCards = false;
  };

  return box;
}]);
