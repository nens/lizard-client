'use strict';

/**
 * Initialise app
 */
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
 * Overview
 * ========
 *
 * Defines general models and gets data from server; functions that are not
 * relevant for rootscope live in their own controller
 *
 * Directives watch models in MasterCtrl and respond to changes in those models
 * for example, a user zooms in on the timeline, the timeline directive sets 
 * the temporal.extent on the state.temporal; a map directive watches state.temporal
 * and updates map objects accordingly.
 * 
 * Models
 * ======
 *
 * Application state
 * -----------------
 * state.spatial 
 * state.temporal
 * state.animate ?
 * state.tools
 * user.profile
 *
 * Data
 * ----
 * data.active
 * data.objects
 * data.events
 * data.timeseries
 * data.aggregates
 *
 * TODO / Refactor
 * ---------------
 * 
 * Stuff to reconsider, rethink, refactor:
 *
 * * [ ] Refactor master controller (states, data!)
 * * [ ] Refactor index.html and base-debug.html
 * * [ ] Fix + document Gruntfile.js / workflow
 * * [ ] Refactor css (csslint, -moz and -webkit)
 * * [ ] Integrate 3di into this paradigm (move from threedi to source/app)
 * * [ ] Refactor map controller and directives (e.g. layers come from djangotemplates)
 * * [ ] Refactor timeline controller and directive
 * * [ ] Refactor search controller (including search design with ES / Haystack)
 * * [ ] There still is a box model on the scope that is now being **abused** to display
 * data in the box. That should be possible with data and state.tools models
 *
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
  
  // REFACTOR CANDIDATE
  $scope.geoLocate = function () {
    $scope.locate = !$scope.locate;
  };

  $scope.simulateSearch = function (keyword) {
    $scope.box.query = keyword;
    $scope.search();
  };
  // END REFACTOR CANDIDATE
  //
  // BOX FUNCTIONS

  // TOOLS
  $scope.tools = {
    active: "none", //NOTE: make list?
    threedi: {
      enabled: false
    }
  };

  $scope.toggleTool = function (name) {
    if ($scope.tools.active === name) {
      $scope.tools.active = "none";
    } else {
      $scope.tools.active = name;
    }
    // NOTE: ugly hack, record if tool is time aware
    if ($scope.tools.active === "alerts" ||
        $scope.tools.active === "sewerage") {
      $scope.timeline.changed = !$scope.timeline.changed;
    }
  };
  // TOOLS

  // MAP MODEL
  // MOVE TO MAP CONTROL ?
  $scope.mapState = {
    layergroups: CabinetService.layergroups,
    layers: CabinetService.layers,
    baselayers: CabinetService.baselayers,
    eventTypes: CabinetService.eventTypes,
    activeBaselayer: 3,
    changed: Date.now(),
    moved: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false,
    bounds: null,
    geom_wkt: ''
  };
  // /END MOVE TO MAP CONTROL
  // MAP MODEL

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

  $scope.threediTool = function () {
      $scope.box.type = 'threedi';
      $scope.box.content = 'bladiblabla'; // maybe his should change ? :)
      $scope.tools.threedi.enabled = !$scope.tools.threedi.enabled;
  }  
  // 3Di END

  // Legacy formatter for KPI: remove?
  // check how data comes from server? discuss with Jack / Carsten
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
  $scope.selected_timeseries = undefined;

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
      // NOTE: will temporalExtent also control timeiline temporalExtent?
      $scope.box.content.temporalExtent = {
        start: null,
        end: null,
        changedZoom: false,
      };
      $scope.box.content.changeFunction = function (start, stop) {
        console.info('start', start);
        $scope.box.content.temporalExtent.start = start;
        $scope.box.content.temporalExtent.stop = stop;
        $scope.box.content.temporalExtent.changedZoom = !$scope.box.content.temporalExtent.changedZoom;
      };
      $scope.box.content.canceler = $q.defer();
    

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
        fromgrid: $scope.box.content.data,
        //type: $scope.box.content.data.entity_name
        type: data.entity_name
     };

    // Otherwise changes are watched and called to often.
    if ($scope.box.content.timeseries_changed === undefined){
      $scope.box.content.timeseries_changed = true;
    } else {
      $scope.box.content.timeseries_changed = !$scope.box.content.timeseries_changed;
    }
  };

  $scope.$watch('box.content.temporalExtent.changedZoom', function (newVal, oldVal) {
    if (newVal == oldVal) { return; }
    $scope.box.content.canceler.resolve();
    $scope.box.content.canceler = $q.defer();
    var timeseries = $resource('/api/v1/timeseries/:id/?start=:start&end=:end', {
      id: '@id',
      start: '@start',
      end: '@end'
      },
      {get: 
        {method: 'GET', timeout: $scope.box.content.canceler.promise}
      });
    if ($scope.selected_timeseries) {
      timeseries.get({
        id: $scope.selected_timeseries.id,
        start: $scope.box.content.temporalExtent.start,
        end: $scope.box.content.temporalExtent.end
      }, function(response){
        $scope.data = {
          series: response.events.series,
          instants: response.events.instants
        };
        $scope.selected_timeseries.events = response.events;
        // var response;
        // if ($scope.timeseries.length > 0){
        //   $scope.selected_timeseries = response[0];
        // } else {
        //   $scope.selected_timeseries = undefined;
        // }
      });      
    }
  });

  $scope.$watch('selected_timeseries.id', function () {
    if ($scope.selected_timeseries !== undefined){
      // NOTE: this will change to $scope.selected_timeseries.instants
      $scope.data = {
          series: $scope.selected_timeseries.events.series,
          instants: $scope.selected_timeseries.events.instants
        };
      // dit kan zeker nog mooier
      $scope.metadata.title = " - " + $scope.selected_timeseries.location.name;
      $scope.metadata.ylabel = "";//$scope.selected_timeseries.parameter + $scope.selected_timeseries.unit.code
      $scope.metadata.xlabel = "Tijd";
    } else {
      $scope.data = undefined;
    }
  });

// END Timeseries

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
  // var alerts = '/static/data/klachten_purmerend_min.geojson';
  // $http.get(alerts)
  //   .success(function (data) {
  //     $scope.kpi[0].pi[0].data = data;  
  //     //console.log("event data", data);
  //   });
  // END HACK

  /*
   * Get raster data from server
   * NOTE: maybe add a callback as argument?
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
        // NOTE: hack to try pop_density
        // NOTE: maybe this function should return something
        // instead of setting variables.
        if (raster_names === 'pop_density') {
          $scope.box.pop_density = data;
        } else if (agg === 'curve') {
          $scope.data = $scope.format_rastercurve(data);
          $scope.box.content = {
            yLabel: 'hoogte [mNAP]',
            xLabel: '[%]'
          };
        } else if (agg === 'counts') {
          $scope.data = data;
        } else {
          // var d3data = format_data(data);
          $scope.box.type = "profile";
          $scope.box.content = {
            data: data,
            yLabel: 'hoogte [mNAP]',
            xLabel: 'afstand [m]'
          };
        }
      })
      .error(function (data) {
        //TODO: implement error function to return no data + message
        console.info("failed getting profile data from server");
      });
  };

  $scope.format_rastercurve = function (data) {
    var formatted = [];
    for (var i in data[0]) {
      var datarow = [data[0][i],data[1][i]];
      formatted.push(datarow);
    }
    return formatted;
  };

  /**
   * Temporal extent model
   */
  $scope.timeline = {
    temporalExtent: {
      start: Date.now() - 31556900000, // 1 year in ms
      end: Date.now(),
      changedZoom: true,
      at: Date.now() - this.start
    },
    tool: 'zoom',
    canceler: $q.defer(),
    enabled: false,
    data: {}
  };
// END Temporal extent model

/**
* keypress stuff
*/

  // If escape is pressed close box
  $scope.keyPress = function ($event) {
    // watches can be placed in corresponding ctrls. as in MapCtrl
    if ($event.target.nodeName === "INPUT" && 
      ($event.which !== 27 && $event.which !== 13)) {
     return; 
   }
    $scope.keyPressed = $event.which;
    $scope.keyTarget = $event.target;
    if ($event.which === 27) {
      $scope.box.type = 'empty';
      $scope.box.empty = null;
    }

  };

//END keypress

/*
* animation stuffs
*/
  

  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;


  var buildAnimationDatetimes = function () {
            // Build datetime objects to retrieve wms layers later on.
        var hours = 3 * 60;
        var animationDatetimes = [];
        var now = moment();
        
        // The wms only accepts requests for every 5th minute exact
        now.minutes((Math.round(now.minutes()/5) * 5) % 60);
        now.seconds(0);
        //console.debug("Now rounded = ", now.format('YYYY-MM-DDTHH:mm:ss'));

        for (var interval = 5; interval < hours; interval = interval + 5) {
            var animationDatetime = now.subtract('minutes', 5);
            var UtsieAniDatetime = moment.utc(animationDatetime);
            animationDatetimes.push(UtsieAniDatetime.format('YYYY-MM-DDTHH:mm:ss') + '.000Z');
            }

        animationDatetimes.reverse();
        return animationDatetimes;
    };

    var imageUrlBase = 'http://regenradar.lizard.net/wms/?WIDTH=525&HEIGHT=497&SRS=EPSG%3A3857&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME=';
    var dates = buildAnimationDatetimes();
    var radarImages = [];

    // delete $http.defaults.headers.common['X-Requested-With'];

    for (var i in dates) {
      var date = dates[i];
      radarImages.push(imageUrlBase + date);
    }

  $scope.animation = {
    at: Date.now(),
    playing: false,
    enabled: false,
    frame: radarImages,
    currentFrame: 0,
    currentDate: Date.parse(dates[0])
  };

  //tmp
  $scope.toggleRain = function () {
    $scope.animation.enabled = !$scope.animation.enabled;
    if ($scope.animation.enabled) {
      if (!$scope.timeline.hidden) { 
        $scope.timeline.hidden = false;
        $scope.timeline.resizeTimeline();
      }
      $scope.animationDriver();
      $scope.animation.playing = true;
      // $scope.timeline.temporalExtent.start = Date.parse(dates[0]);
      // $scope.timeline.temporalExtent.end = Date.parse(dates[dates.length-1]);
    } else {
      $scope.animation.enabled = false;
      $scope.animation.playing = false;
    }
  };

  $scope.toggleRainPlay = function (toggle) {
    if ($scope.animation.enabled) {
      if ($scope.animation.playing || toggle == "off") {
        $scope.animation.playing = false;
      } else {
        $scope.animationDriver();
        $scope.animation.playing = true;      
      }
    }
  };

  var start = null;
  // var keys = Object.keys($scope.animation.frame);
  var finalFrame = radarImages.length- 1;
  var progress;

  $scope.$watch('animation.currentFrame', function (newVal, oldVal) {
    if (newVal === oldVal) { return;}
    $scope.animation.currentDate = Date.parse(dates[$scope.animation.currentFrame]);

  });

  $scope.step =  function (timestamp) {
    $scope.$apply(function () {
      $scope.animation.currentFrame++;
    });

    progress = timestamp - start;    
    if ($scope.animation.currentFrame == finalFrame) {
      $scope.animation.currentFrame = -1;
    }  
    if ($scope.animation.playing) {
      setTimeout(function () {
        requestAnimationFrame($scope.step);
      }, 100);
    }    
  }

  $scope.animationDriver = function () { 
    requestAnimationFrame($scope.step);
  };


// END animation

}]);
