'use strict';

// wtf.
document.ondblclick = function(e) {
    var clickObj = document.createElement("div"),
        inner = document.createElement("div");
    inner.className = "clickObj";
    clickObj.style.position = "absolute";
    clickObj.style.top = e.clientY + "px";
    clickObj.style.left = e.clientX + "px";
    this.body.appendChild(clickObj);
    clickObj.appendChild(inner);
    setTimeout(function() { clickObj.remove(); }, 1000);
};

var app = angular.module("lizard-nxt", [
  'ngResource',
  'ui.event',
  'ui.highlight',
  'ui.keypress',
  'ngProgress',
  // 'omnibox',
  'lizard-nxt.services']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
 });


app.controller("MasterCtrl",
  ["$scope", "Omnibox", "CabinetService", "KpiService", 
  function ($scope, Omnibox, CabinetService, KpiService)  {

  $scope.box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'empty',
    content: {},
    changed: Date.now()
  };

  // NOTE: DRY idiot.
  $scope.tools = {
    kpi: {
      enabled: false
    },
    profile: {
      enabled: false
    }
  };

  $scope.toggle_tool = function (name) {
    if ($scope.tools.hasOwnProperty(name)){
      $scope.tools[name].enabled = !$scope.tools[name].enabled;
    }
  };

// SEARCH-START
  $scope.search = function ($event) {

    if ($scope.box.query.length > 1) {
      var search = CabinetService.search.get({q: $scope.box.query}, function (data) {
          console.log(data.hits.hits);
          var sources = [];
          for (var i in data.hits.hits) {
            sources.push(data.hits.hits[i]._source);
          }
          $scope.searchData = sources;
        });

      
      var geocode = CabinetService.geocode.query({q: $scope.box.query}, function (data) {
              console.log(data);
              $scope.box.content = data;
            });
      $scope.box.type = "location";
    }
  };

  $scope.reset_query = function () {
      // clean stuff..
      // Search Ctrl is the parent of omnibox cards
      // therefore no need to call $rootScope.
      $scope.$broadcast('clean');
      $scope.box.query = null;
      $scope.box.type= 'empty';
  };

  $scope.showDetails = function (obj) {
      $scope.currentObject = obj;
      if ($scope.currentObject.lat && $scope.currentObject.lon) {
          // A lat and lon are present, instruct the map to pan/zoom to it
          var latlng = {'lat': $scope.currentObject.lat, 'lon': $scope.currentObject.lon};
          $scope.panZoom = {
            lat: $scope.currentObject.lat,
            lng: $scope.currentObject.lon,
            zoom: 14
          };
      }
  };
// SEARCH-END


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

  $scope.toggleLayerSwitcher = function () {
    if ($scope.data.enabled) {
      $scope.data.enabled = false;
      $scope.data.disabled = true;
      }
    else {
      $scope.data.enabled = true;
      $scope.data.disabled = false;
    }
  };

  $scope.changed = function() {
    $scope.data.changed = Date.now();
  };

  $scope.onAreaClick = function(area){
    $scope.$apply(function(){
      $scope.kpi.slct_area = area;
      $scope.kpi.kpichanged = !$scope.kpi.kpichanged;
    });
  };


  $scope.format_data = function (data) {
    if (data[0]){
    $scope.formatted_data = [];
      for (var i=0; i<data[0].values.length; i++){
        xyobject = {
          date: data[1].values[i],
          value: data[0].values[i]
        };
        $scope.formatted_data.push(xyobject);
      }
    } else {
      $scope.formatted_data = undefined;
    }
    return $scope.formatted_data;
  };

}]);