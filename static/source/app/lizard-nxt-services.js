var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("Cabinet", ["$resource", "$rootScope",
  function($resource, $rootScope) {

  var layergroups = [];

  var baselayers = [
      {
        active: true,
        id: 1,
        name: "Open Street Map",
        url: "http://dev1.nxt.lizard.net:9000/osm_nens/{z}/{x}/{y}.png",
        leafletLayer: L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png')
      }];

  var searchResource,
      geocodeResource,
      reverseGeocodeResource;
  
  searchResource = $resource('/api/v1/search/');
  geocodeResource = $resource('/api/v1/geocode/');
  reverseGeocodeResource = $resource('/api/v1/reversegeocode/');


  apiLayerGroups = $resource('/api/v1/layergroups//:id/',
    {
      id:'@id'
    }, {
      'query': {method: "GET", isArray:false}
    });

  apiLayerGroups.query(function(response) {
    angular.copy(response.results, layergroups);
     
  // Default to inactive and ensure it has a leaflet layer
    for (var i = 0; i < layergroups.length; i ++) {
      var layergroup = layergroups[i];
      for (var j = 0; j < layergroup.layers.length; j ++) {
        var layer = layergroup.layers[j];
        if (layer.active !== true) {
          layer.active = false;
        }
        if (layer.leafletLayer === undefined) {
          layer.leafletLayer = L.tileLayer(layer.url);
        }
      }
    }
    $rootScope.$broadcast('LayersRetrieved');
  });

  return {
    layergroups: layergroups,
    baselayers: baselayers,
    search: searchResource,
    geocode: geocodeResource,
    reverseGeocode: reverseGeocodeResource
  };

}]);


services.service("leaflet", ["$rootScope", "Cabinet", function($rootScope, Cabinet) {
  var map = L.map('map', {
    center: new L.LatLng(52.0992287, 5.5698782),
    zoomControl: false,
    zoom: 8
  });

  function addDefaultLayers(layers) {
    for (var i = 0; i < layers.length; i ++) {
    var layer = layers[i];
    if (layer.active === true) {
      map.addLayer(layer.leafletLayer);
      }
    }
  };

  addDefaultLayers(Cabinet.baselayers);

  var scope = $rootScope.$new();
  scope.$on('LayersRetrieved', function(event, layer) {
    console.log("layers retrieved");
    for (var i = 0; i < Cabinet.layergroups.length; i ++) {
      addDefaultLayers(Cabinet.layergroups[i]);
    }
  });

  scope.$on('LayerSwitched', function(event, layer) {
    console.log("layer switched");
    if (layer.active === true) {
      map.addLayer(layer.leafletLayer);
    }
    if (layer.active === false) {
      map.removeLayer(layer.leafletLayer);
    }
  });

  return{
    map: map
  };
}]);


services.service("Omnibox", [function() {
  var box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'empty', // <-- mocking so Gijs can build a template...
    content: 'empty',
  };

  box.open = function(type){
    box.type = type;
    box.showCards = true;
  };

  box.close = function(){
    box.type = 'empty';
    box.showCards = false;
  };

  return box
}]);