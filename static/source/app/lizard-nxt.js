var app = angular.module("lizard-nxt", [
  'ngResource', 
  'ui.event', 
  'ui.highlight', 
  'ui.keypress',
  'omnibox',
  'lizard-nxt.services']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


app.controller("MapLayerCtrl", ["$rootScope", "$scope", "Cabinet", function($rootScope, $scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.activeBaselayer = 3;

  $scope.switch = function(layer) {
    $rootScope.$broadcast('LayerSwitched', layer);
    console.log("switching layer", layer.name);
  };

  $scope.$watch('activeBaselayer', function() {
    // TODO: Refactor this 
    // possibly include a different layertype in database
     for (var i = 0; i < $scope.layergroups.length; i ++) {
      var layergroup = $scope.layergroups[i]
      for (var j = 0; j < layergroup.layers.length; j ++) {
        var layer = layergroup.layers[j];
        if (layer.baselayer && layer.id == $scope.activeBaselayer) {
          $rootScope.$broadcast('LayerOn', layer);
        } else if (layer.baselayer && layer.id != $scope.activeBaselayer) {
          $rootScope.$broadcast('LayerOff', layer);

        }
      }
    }
  });

}]);

app.controller("MapCtrl",
  ["$scope", "$rootScope", "leaflet", function($scope, $rootScope, leaflet) {

    leaflet.map.on('click', function(e) {
        $rootScope.$broadcast('mapclick', e.latlng);
    });
}]);
