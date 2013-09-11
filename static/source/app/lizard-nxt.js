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


app.controller("MapCtrl", ["$rootScope", "$scope", "Cabinet", function($rootScope, $scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.layers = Cabinet.layers;
  $scope.activeBaselayer;

  $scope.$on('baselayerActive', function(event, activeBaselayer) {
    $scope.activeBaselayer = activeBaselayer;
  });

  $scope.switch = function(layer) {
    $rootScope.$broadcast('LayerSwitched', layer);
  };

  $scope.$watch('activeBaselayer', function() {
    // TODO: Refactor this
    // possibly include a baselayer layertype in database
     for (var i = 0; i < $scope.layergroups.length; i ++) {
      var layergroup = $scope.layergroups[i];
      for (var j = 0; j < layergroup.layers.length; j ++) {
        var layer = layergroup.layers[j];
        if (layer.baselayer && layer.id == $scope.activeBaselayer) {
          $rootScope.$broadcast('LayerOn', layer);
          layer.active = true;
        } else if (layer.baselayer && layer.id != $scope.activeBaselayer) {
          $rootScope.$broadcast('LayerOff', layer);
          layer.active = false;
        }
      }
    }
  });

    // leaflet.map.on('click', function(e) {
    //     $rootScope.$broadcast('mapclick', e.latlng);
    // });
}]);
