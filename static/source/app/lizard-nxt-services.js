var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("Cabinet", ["$resource", "$rootScope", 
  function($resource, $rootScope) {

  var layergroups = [];

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
  }
}]);


services.service("leaflet", ["$rootScope", "Cabinet", function($rootScope, Cabinet) {
  var map = L.map('map', {
    center: new L.LatLng(52.0992287, 5.5698782),
    zoomControl: false,
    zoom: 8,
  });

  function addDefaultLayers(layergroups) {
    for (var i = 0; i < layergroups.length; i ++) {
      var layergroup = layergroups[i]
      for (var j = 0; j < layergroup.layers.length; j ++) {
        var layer = layergroup.layers[j];
        if (layer.leafletLayer === undefined) {
          layer.leafletLayer = L.tileLayer(layer.url);
        }
        if (layer.active) {
          map.addLayer(layer.leafletLayer);
        if (layer.baselayer) {
          layer.leafletLayer.bringToBack();
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
  });

  scope.$on('LayerOff', function(event, layer) {
    map.removeLayer(layer.leafletLayer);
  });


  return{
    map: map
  }
}]);
