var app = angular.module("lizard-nxt", ['ngResource']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  //
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


app.service("Cabinet", ["$resource", "$rootScope", 
  function($resource, $rootScope) {

  var layergroups = [];

  var apiLayerGroups,
      baselayers = [
      {
        active: true,
        id: 1,
        name: "Open Street Map",
        url: "http://dev1.nxt.lizard.net:9000/osm_nens/{z}/{x}/{y}.png",
        leafletLayer: L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png')
      }];

  apiLayerGroups = $resource('/api/v1/layergroups//:id/', 
    {
      id:'@id'
    }, {
      'query': {method: "GET", isArray:false}
    })

  apiLayerGroups.query(function(response) {
    angular.copy(response.results, layergroups);
     
  // Default to inactive
    for (var i = 0; i < layergroups.length; i ++) {
      var layergroup = layergroups[i];
      for (var j = 0; j < layergroup.layers.length; j ++) {
        var layer = layergroup.layers[j];
        if (layer.active != true) {
          layer.active = false;
        }
      };
    };

  });

  return {
    layergroups: layergroups,
    baselayers: baselayers
  }

}]);


app.controller("MapLayerCtrl", ["$scope", "Cabinet", function($scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.baselayers = Cabinet.baselayers;
}]);

app.controller("Dummy", ["$scope", "Cabinet", function($scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.$watch('layergroups', function() {
    console.log($scope.layergroups)
    }, true);
}]);


app.service("leaflet", function(){
  var map = L.map('map', {
    center: new L.LatLng(52.0992287, 5.5698782),
    zoomControl: false,
    zoom: 8,
  });

  var foregroundLayers = [];

  var backgroundLayers = [
  {
    active: true,
    id: 1,
    name: "Open Street Map",
    url: "http://dev1.nxt.lizard.net:9000/osm_nens/{z}/{x}/{y}.png",
    leafletLayer: L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png')
  }];

  var activeBgLayer = null;

  var getBgLayer = function(){
    return activeBgLayer;
  };

  var addFgLayer = function(layer){
    layer.active = true;
    layer.order = 1;
    if (layer.leafletLayer === undefined){
      layer.leafletLayer = L.tileLayer(layer.url);
    }
    map.addLayer(layer.leafletLayer);
    foregroundLayers.push(layer);
  };

  var removeFgLayer = function(layer){
    layer.active = false;
    map.removeLayer(layer.leafletLayer);
    var index = foregroundLayers.indexOf(layer);
    foregroundLayers.splice(index, 1);
  };

  var switchBgLayer = function(id){
      if (activeBgLayer !== null){
        map.removeLayer(activeBgLayer);    
      }
      backgroundLayers.forEach(function(layer){
        if ((layer.active) && (layer.id != id)){
          layer.active = false;
        }
        if (layer.id == id){
          layer.active = true;
          activeBgLayer = layer.leafletLayer;
        }
        });
      map.addLayer(activeBgLayer, true);
      activeBgLayer.bringToBack();
  };
  switchBgLayer(1);
  return{
    map: map,
    backgroundLayers: backgroundLayers,
    activeBgLayer: activeBgLayer,
    getBgLayer: getBgLayer,
    switchBgLayer: switchBgLayer,
    foregroundLayers: foregroundLayers,
    addFgLayer: addFgLayer,
    removeFgLayer: removeFgLayer
  }
});