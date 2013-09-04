var app = angular.module("lizard-nxt", ['ngResource']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


app.service("Cabinet", ["$resource", "$rootScope", 
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

  this.apiLayerGroups = $resource('/api/v1/layergroups//:id/', 
    {
      id:'@id'
    }, {
      'query': {method: "GET", isArray:false}
    });

  this.apiLayerGroups.query(function(response) {
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
    $rootScope.$broadcast('LayersRetrieved');
  });

  return {
    layergroups: layergroups,
    baselayers: baselayers
  }

}]);


app.controller("MapLayerCtrl", ["$rootScope", "$scope", "Cabinet", function($rootScope, $scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.baselayers = Cabinet.baselayers;

  $scope.switch = function(layer) {
    $rootScope.$broadcast('LayerSwitched', layer);
  };
  }]);

app.controller("MapCtrl",
  ["$scope", "$rootScope", "leaflet", function($scope, $rootScope, leaflet) {

    leaflet.map.on('click', function(e) {
        $rootScope.$broadcast('mapclick', e.latlng);
    });

}]);

app.service("leaflet", ["$rootScope", "Cabinet", function($rootScope, Cabinet) {
  var map = L.map('map', {
    center: new L.LatLng(52.0992287, 5.5698782),
    zoomControl: false,
    zoom: 8,
  });

  for (var i = 0; i < Cabinet.baselayers.length; i ++) {
    var baselayer = Cabinet.baselayers[i];
    if (baselayer.leafletLayer === undefined) {
        layer.leafletLayer = L.tileLayer(layer.url);
      }
    if (baselayer.active === true) {
      map.addLayer(baselayer.leafletLayer);
      console.log("baselayers drawn");
      }
    };

  var scope = $rootScope.$new();

  scope.$on('LayersRetrieved', function(event, layer) {
    console.log("layers retrieved");
    for (var i = 0; i < Cabinet.layergroups.length; i ++) {
      var layergroup = Cabinet.layergroups[i];
      for (var j = 0; j < layergroup.layers.length; j ++) {
        var layer = layergroup.layers[j];
        if (layer.leafletLayer === undefined) {
          layer.leafletLayer = L.tileLayer(layer.url);
        }
        if (layer.active === true) {
          map.addLayer(layer.leafletLayer);
        }
      };
    };
  });

  scope.$on('LayerSwitched', function(event, layer) {
    console.log("layer switched");
    if (layer.leafletLayer === undefined) {
      layer.leafletLayer = L.tileLayer(layer.url);
    }
    if (layer.active === true) {
      map.addLayer(layer.leafletLayer);
    }
    if (layer.active === false) {
      map.removeLayer(layer.leafletLayer);
    }
  });

  return{
    map: map
  }
}]);