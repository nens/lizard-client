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


var templatesUrl = '/static/source/app/templates/';

var app = angular.module("lizard-nxt", [
  'ngResource',
  'ui.event',
  'ui.highlight',
  'ui.keypress',
  'ngProgress',
  'omnibox',
  'lizard-nxt.services']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
 });


app.controller("MasterCtrl",
  ["$scope", "$http" ,"CabinetService", "KpiService", 
  function ($scope, $http, CabinetService, KpiService)  {

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

// KPI START
  $scope.kpi = {
    kpichanged: true,
    thresholds: {'warning': 7, 'error': 5},
    categories: ['tevredenheid_burger',
                    'toestand_infrastructuur',
                    'omgevingseffect',
                    'goed_gebruik',
                    'planrealisatie'],
    cat_dict: { 'tevredenheid_burger': 'Tevredenheid',
                   'toestand_infrastructuur': 'Toestand',
                   'omgevingseffect': 'Omgevingseffect',
                   'goed_gebruik': 'Gebruik',
                   'planrealisatie': 'Planrealisatie'},
    kpiData: {},
    areadata: {},
    slct_area: null
  };

  $scope.$watch('kpi.panZoom', function(){
    $scope.panZoom = $scope.kpi.panZoom;
  });

  $scope.toggle_tool = function (name) {
    if ($scope.tools.hasOwnProperty(name)){
      $scope.tools[name].enabled = !$scope.tools[name].enabled;
    }
  };

  $scope.onAreaClick = function(area){
    $scope.$apply(function(){
      $scope.kpi.slct_area = area;
      $scope.kpi.kpichanged = !$scope.kpi.kpichanged;
    });
  };
// KPI END


// SEARCH-START
  $scope.searchMarkers = [];
  $scope.search = function ($event) {

    if ($scope.box.query.length > 1) {
      var search = CabinetService.termSearch.query({q: $scope.box.query}, function (data) {
          console.log(data);
          var sources = [];
          for (var i in data) {
            sources.push(data[i]);
          }
          $scope.searchMarkers.filter(function (v, i, a) { return a.indexOf (v) == i; });
          for (var j in sources) {
            console.log('sources:',sources);
            $scope.searchMarkers = [];
            if(sources[j].geometry) {
              $scope.searchMarkers.push(sources[j]);
            }
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

  $scope.bbox_update = function(bl_lat, bl_lon, tr_lat, tr_lon) {
    $scope.searchMarkers.filter(function (v, i, a) { return a.indexOf (v) == i; });
    var search = CabinetService.bboxSearch.query({
      bottom_left: bl_lat+','+bl_lon,
      top_right: tr_lat+','+tr_lon
    }, function (data) {
      $scope.searchMarkers = [];
      for(var i in data) {
        if(data[i].geometry) {
          $scope.searchMarkers.push(data[i]);
        }
      }
      console.log('bbox_update:', data);
      $scope.box.bbox_content = data;
      $scope.box.type = "location";
    });
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
      console.log('obj:', obj);
      if ($scope.currentObject.lat && $scope.currentObject.lon) {
          // A lat and lon are present, instruct the map to pan/zoom to it
          var latlng = {'lat': $scope.currentObject.lat, 'lon': $scope.currentObject.lon};
          $scope.panZoom = {
            lat: $scope.currentObject.lat,
            lng: $scope.currentObject.lon,
            zoom: 14
          };
      }
      else if ($scope.currentObject.geometry[0] && $scope.currentObject.geometry[1]) {
          $scope.panZoom = {
            lat: $scope.currentObject.geometry[1],
            lng: $scope.currentObject.geometry[0],
            zoom: 14
          };
      }
  };
// SEARCH-END


  $scope.mapState = {
    layergroups: CabinetService.layergroups,
    layers: CabinetService.layers,
    baselayers: CabinetService.baselayers,
    activeBaselayer: 3,
    changed: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false
  };

  $scope.$on('PanZoomeroom', function(message, value){
    $scope.panZoom = value;
    console.log('PanZoomeroom', value);
  });

  $scope.switchBaseLayer = function(){
    for (var i in $scope.mapState.baselayers){
      if ($scope.mapState.baselayers[i].id == $scope.mapState.activeBaselayer){
        $scope.mapState.baselayers[i].active = true;
      } else {
        $scope.mapState.baselayers[i].active = false;
      }
    }
    $scope.mapState.baselayerChanged = Date.now();
  };

  $scope.toggleLayerGroup = function(layergroup){
    var grouplayers = layergroup.layers;
    for (var i in grouplayers){
      for (var j in $scope.mapState.layers){
        if ($scope.mapState.layers[j].id == grouplayers[i]){
          $scope.mapState.layers[j].active = layergroup.active;
        }
      }
    }
    $scope.mapState.changed = Date.now();
  };

  $scope.toggleLayerSwitcher = function () {
    if ($scope.mapState.enabled) {
      $scope.mapState.enabled = false;
      $scope.mapState.disabled = true;
      }
    else {
      $scope.mapState.enabled = true;
      $scope.mapState.disabled = false;
    }
  };

  $scope.changed = function() {
    $scope.mapState.changed = Date.now();
  };



  $scope.format_data = function (data) {
    if (data[0]){
    $scope.formatted_data = [];
      for (var i=0; i<data[0].values.length; i++){
        var xyobject = {
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


  $scope.getTimeseries = function (data) {

    $scope.box.type =  data.entity_name;
    $scope.box.showCards = true;
    $scope.box.content.object_type = data.entity_name;
    $scope.box.content.id = data.id;
    $scope.box.content.data = data;


    var new_data_get = CabinetService.timeseriesLocationObject.get({
      object_type: $scope.box.content.object_type,
      id: $scope.box.content.id
    }, function(response){
      $scope.timeseries = response.results;
      if ($scope.timeseries.length > 0){
        $scope.selected_timeseries = response.results[0];
      } else {
        $scope.selected_timeseries = undefined;
      }
    });
    $scope.metadata = {
        title: null,
        fromgrid: $scope.box.content.data,
        type: $scope.box.content.data.entity_name
     };


    // Otherwise changes are watched and called to often.
    if ($scope.box.content.timeseries_changed === undefined){
      $scope.box.content.timeseries_changed = true;
    } else {
      $scope.box.content.timeseries_changed = !$scope.box.content.timeseries_changed;
    }
  };

  // rewrite data to make d3 parseable
  var format_data = function (data) {
    var formatted_data = [];
    for (var i = 0; i < data.length; i++) {
      //NOTE: think of fix for nodata in d3
      var value = data[i][1] === null ? 0 : data[i][1];
      var xyobject = {
        distance: data[i][0],
        value: value
      };
      formatted_data.push(xyobject);
    }
    return formatted_data;
  };

  // define function to get profile data from server
  $scope.get_profile = function (linestring_wkt, srs) {
    // build url
    // NOTE: first part hardcoded
    var url = "api/v1/rasters/";
    url += "?raster_names=ahn2";
    url += "&geom=" + linestring_wkt;
    url += "&srs=" + srs;
    // get profile from server
    $http.get(url)
      .success(function (data) {
        var d3data = format_data(data);
        $scope.box.content = d3data;
        $scope.box.type = "profile";
      })
      .error(function (data) {
        //TODO: implement error function to return no data + message
        console.log("failed getting profile data from server");
      });
  };


}]);