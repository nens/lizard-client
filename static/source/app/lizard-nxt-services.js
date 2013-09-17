var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("CabinetService", ["$resource", "$rootScope",
  function($resource, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;

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
    baselayers: baselayers,
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
  };

  box.close = function(){
    box.type = 'empty';
    box.showCards = false;
  };

  return box;
}]);

services.service("KpiService", function(){


   // helper var for watch expressions
  var kpichanged = true;
  var mapzoom = 13;
  // later read this dynamically from source (database)
  var thresholds = {'warning': 8, 'error': 6};
  var categories = ['tevredenheid_burger',
                       'toestand_infrastructuur',
                       'omgevingseffect',
                       'goed_gebruik',
                       'planrealisatie'];



  var kpiData = {};
  var areadata = {};

  return {
    kpichanged: kpichanged,
    mapzoom: mapzoom,
    thresholds: thresholds,
    categories: categories,
    kpiData: kpiData,
    areadata: areadata
  };
})
