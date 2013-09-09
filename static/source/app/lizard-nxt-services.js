var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("Cabinet", ["$resource", "$rootScope",
  function($resource, $rootScope) {

  var layergroups = [];

  var searchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups;
  
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
    $rootScope.$broadcast('LayersRetrieved');
  });

  return {
    layergroups: layergroups,
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

  function addDefaultLayers(layergroups) {
    for (var i = 0; i < layergroups.length; i ++) {
      var layergroup = layergroups[i]
      for (var j = 0; j < layergroup.layers.length; j ++) {
        var layer = layergroup.layers[j];
        if (layer.leafletLayer === undefined) {
          if (layer.type == "WMS") {
            // TODO: fix something more robust for WMS layers. 
            // It works when the layer.url defines the layer name
            // and the wms server is hardcoded
            console.log(layer.type, layer);
            wms = 'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms';
            layer.leafletLayer = L.tileLayer.wms(wms, {
              layers: layer.url,
              format: 'image/png',
              version: '1.1.1' });
          }
          else {
            layer.leafletLayer = L.tileLayer(layer.url);
          }
        }
        if (layer.active) {
          map.addLayer(layer.leafletLayer);
          if (layer.baselayer) {
            layer.leafletLayer.bringToBack();
            $rootScope.$broadcast('baselayerActive', layer.id);
          }
        }
      }
    }
  };

  var scope = $rootScope.$new();

  scope.$on('LayersRetrieved', function(event, layer) {
    addDefaultLayers(Cabinet.layergroups);
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

  scope.$on('LayerOn', function(event, layer) {
    map.addLayer(layer.leafletLayer);
    if (layer.baselayer) {
      layer.leafletLayer.bringToBack();
    }
  });

  scope.$on('LayerOff', function(event, layer) {
    map.removeLayer(layer.leafletLayer);
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
