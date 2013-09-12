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


app.controller("MapCtrl", ["$rootScope", "$scope", "Cabinet", 
  function($rootScope, $scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.layers = Cabinet.layers;
  $scope.baselayers = Cabinet.baselayers;
  $scope.activeBaselayer = 3;

  $scope.switchBaseLayer = function(){
    // $scope.activeBaselayer = 
    for (var i in $scope.baselayers){
      if ($scope.baselayers[i].id == $scope.activeBaselayer){
        $scope.baselayers[i].active = true;
      } else {
        $scope.baselayers[i].active = false;
      }
    }
  };

  $scope.toggleLayerGroup = function(layergroup){
    var grouplayers = layergroup.layers;
    for (var i in grouplayers){
      for (var j in $scope.layers){
        if ($scope.layers[j].id == grouplayers[i]){
          $scope.layers[j].active = layergroup.active;

          // layers.active = layergroup.active;
        }
      }
    }
  };

}]);
