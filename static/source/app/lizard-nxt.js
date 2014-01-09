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
 * * [ ] Refactor timeline out of mapState with its own scope
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
      $scope.timeState.changed = !$scope.timeState.changed;
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

  // TIME MODEL
  $scope.timeState = {
    start: 1381363200000, // 10nd of october 2013, works nicely with the twitter data
    end: Date.now(),
    changedZoom: Date.now(),
    at: this.start,
    timeline: {
      tool: 'zoom',
      canceler: $q.defer(),
      enabled: false,
      data: {},
      changed: Date.now()
    },
    animation: {
      playing: false,
      enabled: false,
      currentFrame: 0,
      lenght: 0,
      speed: 20,
      stepSize: 1000
    }
  };
// END TIME MODEL

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
  $scope.box.content.selected_timeseries = undefined;

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
        $scope.box.content.selected_timeseries = response[0];
      } else {
        $scope.box.content.selected_timeseries = undefined;
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
    if (newVal == oldVal || ($scope.box.content.canceler === undefined)) { return; }
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
    if ($scope.box.content.selected_timeseries) {
      timeseries.get({
        id: $scope.box.content.selected_timeseries.id,
        start: $scope.box.content.temporalExtent.start,
        end: $scope.box.content.temporalExtent.end
      }, function(response){
        $scope.data = {
          series: response.events.series,
          instants: response.events.instants
        };
        $scope.box.content.selected_timeseries.events = response.events;
        // var response;
        // if ($scope.timeseries.length > 0){
        //   $scope.selected_timeseries = response[0];
        // } else {
        //   $scope.selected_timeseries = undefined;
        // }
      });      
    }
  });

  $scope.$watch('box.content.selected_timeseries.id', function () {
    if ($scope.box.content.selected_timeseries !== undefined){
      // NOTE: this will change to $scope.selected_timeseries.instants
      $scope.data = {
          series: $scope.box.content.selected_timeseries.events.series,
          instants: $scope.box.content.selected_timeseries.events.instants
        };
      // dit kan zeker nog mooier
      $scope.metadata.title = " - " + $scope.box.content.selected_timeseries.location.name;
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
  $scope.getRasterData = function (raster_names, linestring_wkt, srs, agg, timeout) {
    // build url
    // NOTE: first part hardcoded
    var url = "api/v1/rasters/";
    url += "?raster_names=" + raster_names;
    url += "&geom=" + linestring_wkt;
    url += "&srs=" + srs;
    if (agg !== undefined) {
      url += "&agg=" + agg;  
    }
    var config = {
      method: 'GET',
      url: url
    };
    if (timeout) {
      config.timeout = $scope.mapState.timeout.promise;
    }
    // get profile from serverr
    $http(config)
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
        if (!timeout) {
          console.info("failed getting profile data from server");        
        }
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
* keypress stuff
*/

  // If escape is pressed close box
  // NOTE: This fires the watches too often
  $scope.keyPress = function ($event) {
    // watches can be placed in corresponding ctrls. as in MapCtrl
    if ($event.target.nodeName === "INPUT" && 
      ($event.which !== 27 && $event.which !== 13)) {
     return; 
   }
    $scope.keyIsPressed = !$scope.keyIsPressed;
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


  $scope.timeState.enableAnimation = function (toggle) {
    if ($scope.timeState.animation.enabled || toggle === "off") {
      $scope.timeState.animation.enabled = false;
    } else {
      $scope.timeState.animationDriver();
      $scope.timeState.animation.enabled = true;
    }
  };

  $scope.timeState.playPauseAnimation = function (toggle) {
    if (!$scope.timeState.animation.enabled) {
      $scope.timeState.enableAnimation();
    }
    if ($scope.timeState.animation.playing || toggle === "off") {
      $scope.timeState.animation.playing = false;
    } else {
      $scope.timeState.animation.playing = true;
      window.requestAnimationFrame($scope.timeState.step);
    }
  };

  $scope.timeState.step =  function (timestamp) {
    $scope.timeState.timeStep = ($scope.timeState.end - $scope.timeState.start) / $scope.timeState.animation.stepSize;
    $scope.$apply(function () {
      $scope.timeState.animation.start += $scope.timeState.timeStep;
      $scope.timeState.animation.end += $scope.timeState.timeStep;
      $scope.timeState.at = ($scope.timeState.animation.end + $scope.timeState.animation.start) / 2;
    });
    if ($scope.timeState.at >= $scope.timeState.end || $scope.timeState.at < $scope.timeState.start) {
      $scope.$apply(function () {
        $scope.timeState.animation.end = $scope.timeState.animation.end - $scope.timeState.animation.start + $scope.timeState.start;
        $scope.timeState.animation.start = $scope.timeState.start;
        $scope.timeState.at = ($scope.timeState.animation.end + $scope.timeState.animation.start) / 2;
        if ($scope.rain.enabled) {
          $scope.rain.currentFrame = null;
          $scope.rain.currentDate = Date.parse($scope.rain.dates[0]);
        }
      });
    }
    if ($scope.timeState.animation.playing) {
      setTimeout(function () {
        window.requestAnimationFrame($scope.timeState.step);
      }, 400 - Math.pow($scope.timeState.animation.speed, 2));
    }
  };

  $scope.timeState.animationDriver = function () {
    $scope.timeState.at = $scope.timeState.start;
  };


  var d = new Date();
  var timeZoneOffset = d.getTimezoneOffset() * 60000;

  // Watch for animation
  $scope.$watch('timeState.at', function (n, o) {
    if (n === o) { return true; }
    if ($scope.rain.enabled) {
      var roundedMoment = Math.round($scope.timeState.at / 300000) * 300000 - timeZoneOffset; //Round to nearest five minutes
      if (roundedMoment !== $scope.rain.currentDate &&
        roundedMoment >= ($scope.rain.currentDate + 300000) ||
        roundedMoment <= ($scope.rain.currentDate - 300000)) {
        $scope.rain.currentDate = roundedMoment;
        if ($scope.rain.imageDates.indexOf(roundedMoment) !== -1) { // Check whether we have an image for this moment
          $scope.rain.currentFrame = roundedMoment;
        }
      }
      if (roundedMoment < Date.parse($scope.rain.dates[0]) || roundedMoment > Date.parse($scope.rain.dates[$scope.rain.dates.length - 1])) {
        $scope.rain.currentFrame = null;
      }
    }
  });

  // Watch for fast-forward
  $scope.$watch('timeState.animation.stepSize', function (n, o) {
    if (n === o) { return true; }
    if (!$scope.timeState.animation.playing) {
      $scope.timeState.playPauseAnimation();
    }
  });

  // Step back function
  $scope.timeState.animation.stepBack = function () {
    var stepBack = ($scope.timeState.end - $scope.timeState.start) / 10;
    var wasOn = $scope.timeState.animation.playing;
    $scope.timeState.animation.start = $scope.timeState.animation.start - stepBack;
    $scope.timeState.animation.end = $scope.timeState.animation.end - stepBack;
    $scope.timeState.playPauseAnimation('off');
    if (!$scope.timeState.animation.playing && wasOn) {
      setTimeout(function () {
      $scope.timeState.playPauseAnimation();
      }, 500);
    } else {

      $scope.timeState.at = ($scope.timeState.animation.end + $scope.timeState.animation.start) / 2;
    }
  };

// END animation
// START Rain Stuff

  var buildAnimationDatetimes = function () {
        /*
        * Get radarimages for every 5th minutes if this fits in the localstorage, else confine to every 10th minute
        */
        var hours = ($scope.timeState.end - $scope.timeState.start) / 60000;
        var animationDatetimes = [];
        var now = moment($scope.timeState.end);
        now.hours(now.hours() - (60 / now.zone()));
        
        // The wms only accepts requests for every 5th minute exact
        now.minutes((Math.round(now.minutes() / 5) * 5) % 60);
        now.seconds(0);

        var intervalAdd = 5;
        if (hours / 5 > 200) { intervalAdd = 25; }
        else if (hours / 5 > 150) { intervalAdd = 20; }
        else if (hours / 5 > 100) { intervalAdd = 15; }

        console.log("Getting radar images from", new Date($scope.timeState.start),
                    "to", new Date($scope.timeState.end),
                    "for every", intervalAdd, "th minute");

        for (var interval = 5; interval < hours; interval = interval + intervalAdd) {
          var animationDatetime = now.subtract('minutes', intervalAdd);
          var UtsieAniDatetime = now.utc();
          animationDatetimes.push(UtsieAniDatetime.format('YYYY-MM-DDTHH:mm:ss') + '.000Z');
        }
        animationDatetimes.reverse();

        return animationDatetimes;
      };

    // delete $http.defaults.headers.common['X-Requested-With'];

  var ripImage = function (base, date, item) {
    // var container = 
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 525;
    canvas.height = 497;
    var img = document.createElement('img');
    img.onload = function (e) {
      $scope.rain.imageDates.push(Date.parse(date));
      ctx.drawImage(img, 0, 0, 525, 497);
      var url = canvas.toDataURL(); // thank you: http://html5-demos.appspot.com/static/html5-whats-new/template/index.html#14
      localStorage.setItem(Date.parse(date), url);
      canvas.remove();
    };
    img.crossOrigin = 'anonymous';
    img.src = base + date;
  };

  $scope.rain = {
    enabled: false,
  };

  $scope.toggleRain = function (toggle) {
    if ($scope.rain.enabled === false) {
      /*
      * Currently the server stores only the last 24 hours. 
      * Reset temporalextent to this last twenty four if it exceeds these limits
      */
      var twentyFourAgo = Date.now() - 86400000;
      if ($scope.timeState.start < twentyFourAgo) {
        $scope.timeState.start = twentyFourAgo;
        $scope.timeState.timeline.changed = !$scope.timeState.timeline.changed;
      }
      if ($scope.timeState.end < twentyFourAgo || $scope.timeState.end > Date.now()) {
        $scope.timeState.end =  Date.now();
        $scope.timeState.timeline.changed = !$scope.timeState.timeline.changed;
      }
      getRadarImages();
      $scope.rain.enabled = true;
      if (!$scope.timeState.hidden) {
        $scope.timeState.hidden = false;
        $scope.timeState.resizeTimeline();
      }
    } else if ($scope.rain.enabled || toggle === 'off') {
      $scope.rain.enabled = false;
      localStorage.clear();
    }
  };

  var getRadarImages = function () {
    $scope.rain.imageDates = [];
    var imageUrlBase = 'http://regenradar.lizard.net/wms/?WIDTH=525&HEIGHT=497&SRS=EPSG%3A3857&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME=';
    $scope.rain.dates = buildAnimationDatetimes();
    localStorage.clear();
    for (var i = 0; i < $scope.rain.dates.length; i++) {
      var date = $scope.rain.dates[i];
      ripImage(imageUrlBase, date, i);
    }
    $scope.rain.length = $scope.rain.dates.length - 1;
    $scope.rain.currentFrame = 0;
    $scope.rain.currentDate = Date.parse($scope.rain.dates[0]);
  };

// End rain stuff

}]);
