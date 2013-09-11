var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("Cabinet", ["$resource", "$rootScope",
  function($resource, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;



  var searchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups;
  
  searchResource = $resource('/api/v1/search/');
  geocodeResource = $resource('/api/v1/geocode/');
  reverseGeocodeResource = $resource('/api/v1/reversegeocode/');

  $rootScope.$broadcast('LayersRetrieved');

  return {
    layergroups: layergroups,
    layers: layers,
    search: searchResource,
    geocode: geocodeResource,
    reverseGeocode: reverseGeocodeResource
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
    $rootScope.$broadcast('Omnibox_change');
  };

  box.close = function(){
    box.type = 'empty';
    box.showCards = false;
  };

  return box;
}]);
