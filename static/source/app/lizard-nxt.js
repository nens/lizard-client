'use strict';

var templatesUrl = '/static/source/app/templates/';

// Initialise app
var app = angular.module("lizard-nxt", [
  'ngResource',
  'graph',
  'omnibox',
  'lizard-nxt.services']);

/**
 * Change default angular tags to prevent collision with Django tags
 */
app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
 });


/**
 * Master controller
 *
 * Defines general models and gets data from server; functions that are not
 * relevant for rootscope live in their own controller
 */
app.controller("MasterCtrl",
  ["$scope", "$http", "$resource", "$q", "CabinetService",
  function ($scope, $http, $resource, $q, CabinetService)  {

  // BOX MODEL
  $scope.box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'aggregate', // NOTE: default, box type is aggregate
    content: {},
    changed: Date.now()
  };

  $scope.box.content.alerts = {};
  $scope.box.content.isw = {};
  // BOX MODEL

  // BOX FUNCTIONS
  $scope.box.close = function () {
    $scope.box.type = 'empty';
    $scope.box.showCards = false;
  };

  $scope.geoLocate = function () {
    $scope.locate = !$scope.locate;
  };

  $scope.simulateSearch = function (keyword) {
    $scope.box.query = keyword;
    $scope.search();
  };
  // BOX FUNCTIONS

  // TOOLS
  $scope.tools = {
    alerts: {
      enabled: false
    },
    profile: {
      enabled: false
    },
    threedi: {
      enabled: false
    },
    sewerage: {
      enabled: false
    }
  };

  $scope.toggle_tool = function (name) {
    if ($scope.tools.hasOwnProperty(name)){
      $scope.tools[name].enabled = !$scope.tools[name].enabled;
      for (var toolName in $scope.tools) {
        if (toolName != name && $scope.tools[name].enabled && toolName != undefined) {
          $scope.tools[toolName].enabled = false;
        }
      }
    } else {
      console.log('Unknown tool called: ' + name);
    }
  };
  // TOOLS

  // MAP MODEL
  $scope.mapState = {
    layergroups: CabinetService.layergroups,
    layers: CabinetService.layers,
    baselayers: CabinetService.baselayers,
    activeBaselayer: 3,
    changed: Date.now(),
    moved: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false
  };
  // MAP MODEL

  // NOTE: move map functions to map controller
  // MAP FUNCTIONS
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

  $scope.zoomToTheMagic = function (layer) {
    $scope.layerToZoomTo = layer;
    $scope.zoomToLayer = !$scope.zoomToLayer;
  };
  // MAP FUNCTIONS

  // 3Di START
  $scope.setFollow = function(layer, follow_3di) {
    layer.follow_3di = follow_3di;  // for GUI
    $scope.follow_3di = follow_3di;

    if (follow_3di) {
      // ugly way to make it zoom to 3Di layer when activated
      $scope.layerToZoomTo = layer;
      $scope.zoomToLayer = !$scope.zoomToLayer;    
    }
  };

  $scope.threediTool = function() {
      console.log($scope.box.type);
      $scope.box.type = 'threedi';
      $scope.box.content = 'bladiblabla';
      $scope.tools.threedi.enabled = !$scope.tools.threedi.enabled;
  }  
  // 3Di END

  // Legacy formatter for KPI: remove?
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
  // end legacy formatter

  /**
   * Get data for timeseries
   */
  $scope.getTimeseries = function (data) {
    /* data must have properties entity_name, id */
    // NOTE: this is an aggregation demo HACK
    if (!arguments[1] && arguments[1] != "nochange") {
      $scope.box.type = data.entity_name;
      $scope.box.showCards = true;
    }
      $scope.box.content.object_type = data.entity_name;
      $scope.box.content.id = data.id;
      $scope.box.content.data = data;  
    


    var new_data_get = CabinetService.timeseriesLocationObject.get({
      object_type: $scope.box.content.object_type,
      id: $scope.box.content.id
    }, function(response){
      $scope.timeseries = response;
      if ($scope.timeseries.length > 0){
        $scope.selected_timeseries = response[0];
      } else {
        $scope.selected_timeseries = undefined;
      }
    });

    $scope.metadata = {
        title: null,
        fromgrid: data.entity_name,
        // type: $scope.box.type
        //type: $scope.box.content.data.entity_name
        type: data.entity_name
     };

    $scope.$watch('selected_timeseries', function () {
      if ($scope.selected_timeseries !== undefined){

        $scope.data = $scope.format_data($scope.selected_timeseries.events);
        // dit kan zeker nog mooier
        $scope.metadata.title = " - " + $scope.selected_timeseries.location.name;
        $scope.metadata.ylabel = 'Aciditeit (%)' ; //scope.selected_timeseries.parameter + scope.selected_timeseries.unit.code
        $scope.metadata.xlabel = "Tijd";
      } else {
        $scope.data = undefined;
      }
    });


    // Otherwise changes are watched and called to often.
    if ($scope.box.content.timeseries_changed === undefined){
      $scope.box.content.timeseries_changed = true;
    } else {
      $scope.box.content.timeseries_changed = !$scope.box.content.timeseries_changed;
    }
  };

  // rewrite data to make d3 parseable
  // NOTE: refactor?
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

  /**
   * KPI model
   *
   * KPI is a list of KPI's, every KPI has a name, value, threshold and
   * a list of PI's
   *
   * A PI has a name, data and a threshold
   */
  $scope.kpi = [{"name": "general",
                 "value": 7,
                 "threshold": 6,
                 "pi": [{
                  "name": "Meldingen",
                  "threshold": 8,
                  "data": {}
                 }]
                }];
  // END KPI MODEL
  
  // HACK: get alert (meldingen) data from geojson
  // NOTE: this should come from events in HBASE
  var alerts = '/static/data/klachten_purmerend_min.geojson';
  $http.get(alerts)
    .success(function (data) {
      $scope.kpi[0].pi[0].data = data;  
      console.log("event data", data);
    });

  var events = '/static/data/pumpstation_sewerage.geojson';
  $http.get(events)
    .success(function (data) {
      $scope.events = {};
      $scope.events.rawGeojsondata = data;
    });

  // END HACK

  /*
   * Get raster data from server
   */
  $scope.getRasterData = function (raster_names, linestring_wkt, srs, agg) {
    // build url
    // NOTE: first part hardcoded
    var url = "api/v1/rasters/";
    url += "?raster_names=" + raster_names;
    url += "&geom=" + linestring_wkt;
    url += "&srs=" + srs;
    if (agg !== undefined) {
      url += "&agg=" + agg;  
    }
    // get profile from server
    $http.get(url)
      .success(function (data) {
        //NOTE: hack to try pop_density
        if (raster_names === 'pop_density') {
          $scope.box.pop_density = data;
        } else {
          var d3data = format_data(data);
          $scope.box.type = "profile";
          $scope.box.content = {
            data: d3data,
            yLabel: 'hoogte [mNAP]',
            xLabel: 'afstand [m]'
          }
        }
      })
      .error(function (data) {
        //TODO: implement error function to return no data + message
        console.log("failed getting profile data from server");
      });
  };

  // TIMELINE START
  // NOTE: refactor timeline stuff in it's own controller, most stuff is local
  // to timeline scope; only temporalextent should be exposed to master / root
  $scope.timeline = {
    temporalExtent: {
      start: 1382359037278,
      end: Date.now(),
      changedZoom: true,
      at: Date.now() - this.start
    },
    tool: 'zoom',
    canceler: $q.defer(),
    enabled: false,
    data: [
      { date: 1357714800000, value: Math.random()},
      { date: 1357714800000 + 100000, value: Math.random()},
      { date: 1357714800000 + 200000, value: Math.random()},
      { date: 1357714800000 + 300000, value: Math.random()},
      { date: 1357714800000 + 400000, value: Math.random()},
      { date: 1357714800000 + 500000, value: Math.random()},
      { date: 1357714800000 + 600000, value: Math.random()},
      { date: 1357714800000 + 700000, value: Math.random()},
      { date: 1357714800000 + 800000, value: Math.random()},
      { date: 1357714800000 + 900000, value: Math.random()},
      { date: 1357714800000 + 1000000, value: Math.random()},
      { date: 1357714800000 + 1100000, value: Math.random()},
      { date: 1357714800000 + 1200000, value: Math.random()},
      { date: 1357714800000 + 1300000, value: Math.random()},
      { date: 1357714800000 + 1400000, value: Math.random()},
      { date: 1357714800000 + 1500000, value: Math.random()},
      { date: 1357714800000 + 1600000, value: Math.random()},
      { date: 1357714800000 + 1700000, value: Math.random()},
    ]
  };

  $scope.$watch('timeline.temporalExtent.changedZoom', function (newVal, oldVal) {
    $scope.timeline.canceler.resolve();
    $scope.timeline.canceler = $q.defer();
    var timeseries = $resource('/api/v1/timeseries/:id/', {
      id: '@id',
      start: '@start',
      end: '@end'
    },
    {get: {method: 'GET', timeout: $scope.timeline.canceler.promise}});
    // commented by arjen to prevent 404s in dev
    //var new_data_get = timeseries.get({
      //id: 3,
      //start: $scope.timeline.temporalExtent.start,
      //end: $scope.timeline.temporalExtent.end
    //}, function(response){
      //$scope.timeseries = response;
      //if ($scope.timeseries.length > 0){
        //$scope.selected_timeseries = response[0];
      //} else {
        //$scope.selected_timeseries = undefined;
      //}
    //});


  });

  $scope.timeline.toggleTimeline = function () {
    $scope.timeline.open = !$scope.timeline.open;
  };

  $scope.timeline.toggleTool = function () {
    if ($scope.timeline.tool === 'zoom'){
      $scope.timeline.tool = 'brush';
    } else {
      $scope.timeline.tool = 'zoom';
    }
  };

  $scope.timeline.zoom = {
    in: function () {
      $scope.timeline.zoom.changed = 'in';
    },
    out: function () {
      $scope.timeline.zoom.changed = 'out';
    },
    interval: function (interval) {
      $scope.timeline.interval = interval;
      $scope.timeline.zoom.changed = interval;
    }
  }
  // TIMELINE END 

// NOTE: REFACTOR 
// SEARCH-START
  $scope.searchMarkers = [];
  $scope.search = function ($event) {

    if ($scope.box.query.length > 1) {
      var search = CabinetService.termSearch.query({q: $scope.box.query}, function (data) {
          var sources = [];
          for (var i in data) {
          if(data[i].geometry !== null) {
          sources.push(data[i]);
          }
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

}]);
