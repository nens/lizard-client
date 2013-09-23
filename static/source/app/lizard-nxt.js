var app = angular.module("lizard-nxt", [
  'ngResource',
  'ui.event',
  'ui.highlight',
  'ui.keypress',
  // 'omnibox',
  'lizard-nxt.services']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
 });


app.controller("MapCtrl", ["$scope", "CabinetService", "KpiService" , 
  function($scope, CabinetService, KpiService) {
  $scope.data = {
    layergroups: CabinetService.layergroups,
    layers: CabinetService.layers,
    baselayers: CabinetService.baselayers,
    activeBaselayer: 3,
    changed: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false
  };

  $scope.kpi = KpiService;

  $scope.$watch('kpi.panZoom', function(){
    $scope.panZoom = $scope.kpi.panZoom;
  });

  $scope.$on('PanZoomeroom', function(message, value){
    $scope.panZoom = value;
    console.log('PanZoomeroom', value);
  });

  $scope.switchBaseLayer = function(){
    for (var i in $scope.data.baselayers){
      if ($scope.data.baselayers[i].id == $scope.data.activeBaselayer){
        $scope.data.baselayers[i].active = true;
      } else {
        $scope.data.baselayers[i].active = false;
      }
    }
    $scope.data.baselayerChanged = Date.now();
  };

  $scope.toggleLayerGroup = function(layergroup){
    var grouplayers = layergroup.layers;
    for (var i in grouplayers){
      for (var j in $scope.data.layers){
        if ($scope.data.layers[j].id == grouplayers[i]){
          $scope.data.layers[j].active = layergroup.active;
        }
      }
    }
    $scope.data.changed = Date.now();
  };

  $scope.enableLayerSwitcher = function () {
    $scope.data.enabled = true;
  };

  $scope.disableLayerSwitcher = function () {
    $scope.data.enabled = false;
  };

  $scope.changed = function() {
    $scope.data.changed = Date.now();
  };

  $scope.onAreaClick = function(area){
    $scope.$apply(function(){
      $scope.kpi.slct_area = area;
      $scope.kpi.kpichanged = !$scope.kpi.kpichanged;  
    });
  }

}]);
