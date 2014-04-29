'use strict';

/**
 * Initialise app.
 */
var app = angular.module("lizard-nxt", [
  'graph',
  'omnibox',
  'restangular',
  'ui.bootstrap',
  'lizard-nxt.services'
]);

/**
 * Change default angular tags to prevent collision with Django tags.
 */
app.config(function ($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
});

/**
 * Set url fragment behavior to HTML5 mode (without hash in url).
 */
app.config(function ($locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');
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
 * * [ ] Create a mapState.here to describe the current spatial location 
 *       just like timeState.at describes the now. map-directive should set this, 
 *       watches should listen to this to draw a clicklayer, get rain, get data from utf, etc.
 * * [ ] Refactor map controller and directives
 * * [-] Refactor master controller (states, data!)
 * * [-] Refactor timeline out of mapState with its own scope
 * * [+] Refactor index.html and base-debug.html
 * * [ ] Fix + document Gruntfile.js / workflow
 * * [ ] Refactor css (csslint, -moz and -webkit)
 * * [ ] Move or delete common directory in source
 * * [+] Refactor timeline controller and directive
 * * [ ] Move event logic to event controller (on event / layer tag)
 * * [ ] Move animation logic to animation controller (on timeline tag)

 */
app.controller("MasterCtrl",
  ["$scope", "$http", "Restangular", "$q", "$compile", "CabinetService",
  function ($scope, $http, Restangular, $q, $compile, CabinetService)  {

  // BOX MODEL
  $scope.box = {
    detailMode: false,
    query: null,
    disabled: false,
    showCards: false,
    type: 'empty', // NOTE: default, box type is empty
    content: {},
    changed: Date.now(),
    mouseLoc: []
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
  };

  /**
   * Toggle tool from "name" to "none"
   *
   * Sets tool.active model on scope to name of the tool if tool disabled 
   * or "none" if tool is already enabled.
   *
   * @param {string} name name of the tool to toggle
   *
   */
  $scope.toggleTool = function (name) {
    if ($scope.tools.active === name) {
      $scope.tools.active = "none";
    } else {
      $scope.tools.active = name;
    }
  };

  $scope.toggleCardSize = function() {
    // console.log('toggleCardSize()');
    if ( $scope.box.largeCard ) {
      $scope.box.largeCard = false;
    } else {
      $scope.box.largeCard = true;      
    }
  };

  $scope.toggleDetailmode = function() {
    if($scope.box.detailMode) {
      $scope.box.detailMode = false;
    } else {
      $scope.box.detailMode = true;
    }
    // console.log('Showing detailmode for ', $scope.activeObject);
  };


  // TOOLS

  // MAP MODEL
  // MOVE TO MAP CONTROL ?
  $scope.mapState = {
    layergroups: CabinetService.layergroups,
    layers: CabinetService.layers,
    baselayers: CabinetService.baselayers,
    overlayers: CabinetService.overlayers,
    eventTypes: CabinetService.eventTypes,
    activeBaselayer: 1,
    changed: Date.now(),
    moved: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false,
    bounds: null,
    here: null,
    geom_wkt: '',
    mapMoving: false
  };

  $scope.panZoom = {};
  // /END MOVE TO MAP CONTROL
  // MAP MODEL

  // TIME MODEL
  var end = Date.now();
  $scope.timeState = {
    start: 1389606808000,
    end: 1389952408000,
    changedZoom: Date.now(),
    at: this.start,
    hidden: undefined,
    animation: {
      start: undefined,
      stop: undefined,
      playing: false,
      enabled: false,
      currentFrame: 0,
      lenght: 0,
      speed: 20,
      stepSize: 1000
    }
  };
// END TIME MODEL

  /**
   * Watch to restrict values of timeState.
   */
  $scope.$watch('timeState.changedZoom', function (n, o) {
    if (n === o || $scope.timeState.changeOrigin === 'master') { return true; }
    if ($scope.timeState.start < -315619200000) {
      $scope.timeState.changeOrigin = 'master';
      $scope.timeState.start = -315619200000;
    }
    if ($scope.timeState.end > 2208988800000) {
      $scope.timeState.changeOrigin = 'master';
      $scope.timeState.end = 2208988800000;
    }
  });

// COLOR MODEL
  $scope.colors =  {
    3: ["#27ae60", "#2980b9", "#8e44ad"],
    4: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50"],
    5: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12"],
    6: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12", "#d35400"],
    7: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12", "#d35400", "#c0392b"],
    8: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12", "#d35400", "#c0392b", "#16a085"]
  };

// EVENTS MODEL
  $scope.events = {
    types: { count: 0 }, // Metadata object
    data: { type: "FeatureCollection",
            features: [] // Long format events data object
      },
    scale: d3.scale.ordinal().range($scope.colors[8]),
    changed: Date.now()
  };
  
  /**
   * Zoom to location
   * 
   * Used by the aggregate template under the 'screenshot' icon
   * 
   * @param {object} geometry Object wit a list of lon lat
   */
  $scope.events.zoomTo = function (geometry) {
    var panZoom = {
      lat: geometry.coordinates[1],
      lng: geometry.coordinates[0],
      zoom: 15
    };
    $scope.panZoom = panZoom;
    $scope.mapState.moved = Date.now();
  };

  /**
   * Counts the events currently within the temporal and spatial extent
   * 
   * Called when the user pans the map or zooms the timeline.
   * The aggregate directive flags events that are visible on the map at feature.inSpatExtent
   * The timeline directive flags events that are currently on the map at inTempExtent attribute
   * This function just sums it all up
   */
  $scope.events.countCurrentEvents = function () {
    for (var eventType in $scope.events.types) {
      $scope.events.types[eventType].currentCount = 0;
    }
    for (var i = 0; i < $scope.events.data.features.length; i++) {
      var feature = $scope.events.data.features[i];
      if (feature.inTempExtent && feature.inSpatExtent) {
        eventType = feature.name;
        $scope.events.types[eventType].currentCount++;
      }
    }
  };

  /**
   * Turns event types on or off.
   * 
   * When an event type is off, it is passed to getEvents
   * When an event type is on, it is passed to removeEvents and the remaining events are recolored
   * 
   * @param: str containing the name of the event type to toggle
   */
  $scope.events.toggleEvents = function (name) {
    if ($scope.events.types[name]) {
      if ($scope.events.types[name].active) {
        $scope.events.types[name].active = false;
        $scope.events.data = removeEvents($scope.events.data, name);
        addColor($scope.events.data);
        $scope.events.changed = Date.now();
      } else {
        getEvents(name);
      }
    } else {
      getEvents(name);
    }
    if ($scope.timeState.hidden !== false) {
      $scope.toggleTimeline();
    }
  };

  /**
   * Downloads events and asynchronously fires callback.
   * 
   * Callback passes the response to addEvents, recolors the event data object,
   * Does bookkeeping and triggers watches by updating events.changed
   * 
   * @param: str containing the name of the event type to download
   */
  var getEvents = function (name) {
    // Get data from json as long as there is no db implementation
    var url = '/static/data/' + name + '.geojson';
    $http.get(url)
    .success(function (response) {
      var data = response;
      $scope.events.data = addEvents($scope.events.data, data, name);
      addColor($scope.events.data);
      $scope.events.types[name].count = response.features.length;
      $scope.events.types[name].active = true;
      $scope.events.changed = Date.now();
    });
  };

  /**
   * Adds events to event data object.
   * 
   * Takes a geojson compliant data object which is added to another geojson
   * compliant data object. In order to identify the type of events in the
   * longData object, an eventOrder is added to the features. This eventOrder
   * is also used in the timeline for the yAxis. The indiviudual features also
   * get an id which is used by d3 to identify the events in the update
   * pattern.
   * 
   * @param: object geojson compliant data object to add too
   * @param: object geojson compliant data object to add
   * @param: str containing the name of the event type to add
   * @returns: object geojson compliant data object 
   */
  var addEvents = function (longData, shortData, name) {
    // Create event identifier
    var eventOrder;
    if (longData.features === undefined) {longData.features = []; }
    if (longData.features.length === 0) { eventOrder = 1; }
    else {
      var maxEventOrder = 0;
      angular.forEach(longData.features, function (feature) {
        maxEventOrder = feature.event_type > maxEventOrder ? feature.event_type : maxEventOrder;
      });
      eventOrder = maxEventOrder + 1;
    }
    $scope.events.types[name] = {};
    $scope.events.types[name].event_type = eventOrder;
    angular.forEach(shortData.features, function (feature) {
      feature.event_type = eventOrder;
      feature.color = $scope.colors[8][eventOrder];
      feature.name = name;
      // Create unique id, a combo of time and location. I assume this is always unique..
      feature.id = name + feature.properties.timestamp + feature.geometry.coordinates[0] + feature.geometry.coordinates[1];
      longData.features.push(feature);
    });
    $scope.events.types.count = $scope.events.types.count + 1;
    return longData;
  };

  /**
   * Adds a color attribute to features in event data object
   * 
   * Takes a geojson compliant data object and adds a color to all the features. 
   * If there is only one event type, the events are colored on the basis of sub_event_type
   * If there are multiple event types active, the events are colored on the basis of a colorscale
   * on the scope and the name of the feature.
   * 
   * @param: object geojson compliant data object with all the events
   */
  var addColor = function (longData) {
    var scale;
    if ($scope.events.types.count === 1) {
      scale = d3.scale.ordinal().range($scope.colors[8]);
      angular.forEach(longData.features, function (feature) {
        feature.color = scale(feature.properties.event_sub_type);
      });
    } else {
      angular.forEach(longData.features, function (feature) {
        feature.color = $scope.events.scale(feature.name);
      });
    }
  };
  
  /**
   * Removes events from the data object.
   * 
   * Takes a geojson compliant data object and removes the features with the given name
   * It also removes the metadata of these events and lowers the eventOrder of all the 
   * event types which have a order that is greater than the order of the removed event type.
   * 
   * @param: object geojson compliant data object 
   * @param: str containing the name of the event type to remove
   * @returns: object geojson compliant data object 
   */
  var removeEvents = function (longData, name) {
    var eventOrder = $scope.events.types[name].event_type;
    var iterations = longData.features.length;
    for (var i = 0; i < iterations; i++) {
      var index = iterations - 1 - i;
      var feature = longData.features[index]; // Go from back to front to not mess with the order
      if (feature.name === name) {
        var j = longData.features.indexOf(feature);
        longData.features.splice(j, 1);
      }
      else if (feature.event_type > eventOrder) {
        feature.event_type = feature.event_type - 1;
      }
    }
    for (var key in $scope.events.types) {
      var eType = $scope.events.types[key];
      if (eType.event_type > eventOrder) {
        eType.event_type = eType.event_type - 1;
      }
    }
    $scope.events.types.count = $scope.events.types.count - 1;
    return longData;
  };

  /**
   * Get data for timeseries.
   *
   * the data that is passed as an argument to this function is data from the
   * UTFgrid layer
   *
   */
  $scope.box.content.selected_timeseries = undefined;

  // $scope.getTimeseries = function (data) {
  //   /* data must have properties entity_name, id */
  //   // NOTE: this is an aggregation demo HACK
  //   if (!arguments[1] && arguments[1] !== "nochange") {
  //     $scope.box.type = data.entity_name;
  //     $scope.box.showCards = true;
  //   }

  //   // NOTE: will temporalExtent also control timeiline temporalExtent?
  //   $scope.box.content.temporalExtent = {
  //     start: null,
  //     end: null,
  //     changedZoom: false,
  //   };
  //   $scope.timeseries = [];
  //   $scope.box.content.selected_timeseries = undefined;
   

  //   var new_data_get = 
  //   $scope.metadata = {
  //       title: null,
  //       fromgrid: $scope.box.content.data,
  //       //type: $scope.box.content.data.entity_name
  //       type: data.entity_name
  //     };

  //   // Otherwise changes are watched and called to often.
  //   if ($scope.box.content.timeseries_changed === undefined) {
  //     $scope.box.content.timeseries_changed = true;
  //   } else {
  //     $scope.box.content.timeseries_changed = !$scope.box.content.timeseries_changed;
  //   }
  // };

  $scope.activeObject = {
    changed: true,
    details: false
  };

  $scope.canceler = $q.defer();

  $scope.$watch('activeObject.changed', function (newVal, oldVal) {
    if (newVal === oldVal) { return; }


    // NOTE: this is of course utterly crappy, 
    // I copy pasted this from the 'old way'
    // the only thing changed is the restangular thingy
    // and it not being part of a big blobbish function: getTimeseries
    $scope.box.content.object_type = $scope.activeObject.entity_name;
    $scope.box.content.id = $scope.activeObject.id;
    $scope.box.content.data = $scope.activeObject;
    $scope.box.type = $scope.activeObject.entity_name;

    if ($scope.activeObject.entity_name === 'pumpstation_sewerage'
      || $scope.activeObject.entity_name === 'pumpstation_non_sewerage') {
      CabinetService.timeseries.get({
        object: $scope.box.content.object_type + '$' + $scope.box.content.id,
        start: $scope.timeState.start,
        end: $scope.timeState.end
      }).then(function (response) {
        $scope.timeseries = response;
        if ($scope.timeseries.length > 0) {
          $scope.box.content.selected_timeseries = response[0];
          // for now on scope. legacy..
          $scope.data = {
            data: response[0].events.instants,
            id: $scope.activeObject.id
          };
          $scope.metadata = {
            title: null,
            fromgrid: $scope.box.content.data,
            type: $scope.box.content.data.entity_name
          };
          $scope.timeboxenabled = true;
        } else {
          $scope.timeboxenabled = false;
          $scope.data = null;
          $scope.box.content.selected_timeseries = undefined;
        }
      });
    }
  });

// END Timeseries

  /**
   * Get raster data from server.
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
    // get aggregated raster data from serverr
    $http(config)
      .success(function (data) {
        if (agg === 'curve') {
          $scope.data = $scope.format_rastercurve(data);
          $scope.box.content = {
            yLabel: 'hoogte [mNAP]',
            xLabel: '[%]'
          };
        } else if (agg === 'counts') {
          $scope.data = data;
        } else if (raster_names === 'elevation' && agg === undefined) {
          $scope.box.type = "profile";
          $scope.box.content = {
            data: data,
            yLabel: 'hoogte [mNAP]',
            xLabel: 'afstand [m]'
          };
        } else {
          $scope.box.content = {
            data: data
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
      var datarow = [data[0][i], data[1][i]];
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
    if ($event.target.nodeName === "INPUT" &&
      ($event.which !== 27 && $event.which !== 13)) {
      return;
    }
    $scope.keyIsPressed = !$scope.keyIsPressed;
    $scope.keyPressed = $event.which;
    $scope.keyTarget = $event.target;
    if ($event.which === 27) {
      // If detailMode is active, close that
      if ($scope.box.detailMode) {
        $scope.box.detailMode = false;
      } else {
        // Or else, reset the omnibox state
        $scope.box.type = 'empty';
        $scope.box.empty = null;
      }
    }
  };

  $scope.$watch('keyPressed', function (newVal, oldVal) {
    if (newVal === 51) {
      $scope.mapState.activeBaselayer = 3;
      $scope.mapState.changeBaselayer();
    } else if (newVal === 52) {
      $scope.mapState.activeBaselayer = 4;
      $scope.mapState.changeBaselayer();
    } else if (newVal === 49) {
      $scope.mapState.activeBaselayer = 1;
      $scope.mapState.changeBaselayer();
    } else if (newVal === 50) {
      $scope.mapState.activeBaselayer = 2;
      $scope.mapState.changeBaselayer();
    } else if (newVal === 53) {
      $scope.events.toggleEvents("Twitter");
    } else if (newVal === 54) {
      $scope.events.toggleEvents("Meldingen");
    }
  });

  $scope.toggleLayerInfo = function (layername) {
    if (layername === 'Hoogtekaart') {
      $scope.keyPressed = 51;
    } else if (layername === 'Landgebruik') {
      $scope.keyPressed = 52;
    }
  };

//END keypress

  /**
   * Switch timeline on or off.
   *
   * Uses 3 way logic: true, false and undefined:
   *   undefined: timeline element doesn't exist yet.
   *   false: timeline exists but is hidden.
   *   true: timeline exists and is shown>
   *
   * Initial state of the timeState.hidden is 'undefined'.
   */
  $scope.toggleTimeline = function () {
    if ($scope.timeState.hidden === undefined) {
      // Create timeline element when needed and no earlier
      var timeline = angular.element(
        '<timeline class="navbar timeline navbar-fixed-bottom"></timeline>');
      var el = $compile(timeline)($scope);
      angular.element('#master')
        .append(timeline);
      $scope.timeState.hidden = false;
    } else if ($scope.timeState.hidden === true) {
      $scope.timeState.hidden = false;
      angular.element('#timeline').css('bottom', 0);
    } else if ($scope.timeState.hidden === false) {
      $scope.timeState.hidden = true;
      angular.element('#timeline').css(
        'bottom', 0 - angular.element('#timeline').height());
    }
  };

/**
 * Animation stuff.
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
      });
    }
    if ($scope.timeState.animation.playing) {
      setTimeout(function () {
        window.requestAnimationFrame($scope.timeState.step);
      }, 400 - Math.pow($scope.timeState.animation.speed, 2));
    }
  };

  /**
   * Set timeSate.at to start of timeline.
   */
  $scope.timeState.animationDriver = function () {
    $scope.timeState.at = $scope.timeState.start;
  };

  var animationWasOn;
  // Toggle fast-forward
  $scope.timeState.animation.toggleAnimateFastForward = function (toggle) {
    if (toggle) {
      $scope.timeState.animation.stepSize = $scope.timeState.animation.stepSize / 4;
      animationWasOn = $scope.timeState.animation.playing;
      if (!$scope.timeState.animation.playing) {
        $scope.timeState.playPauseAnimation();
      }
    } else if (!toggle) {
      $scope.timeState.animation.stepSize = $scope.timeState.animation.stepSize * 4;
      if (!animationWasOn) {
        $scope.timeState.playPauseAnimation('off');
      }
    }
  };

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
// TODO: rewrite to handle general dynamic raster stuff.

  /**
   * Initial state 
   */
  $scope.rain = {
    enabled: false,
  };

  /**
   * Switch rain tool on or off.
   *
   * TODO: should be refactored to handle generic dynamic raster layers.
   *
   */
  $scope.toggleRain = function () {
    if ($scope.rain.enabled === false) {
      $scope.getRasterImages();
      $scope.rain.enabled = true;
      if ($scope.timeState.hidden !== false) {
        $scope.toggleTimeline();
      }
    } else if ($scope.rain.enabled) {
      $scope.toggleTimeline();
      $scope.rain.enabled = false;
    }
  };

  /**
   * Get images for dynamic raster layer for interval to prepare for animation.
   *
   * Get 1 image for $scope.timeState.at.
   *
   * TODO:
   * [ ] get images for interval, start / stop
   * [ ] make url variable depending on raster layer 
   * [ ] make coeff variable depending on raster layer, raster layer should
   * publish it's time resolution.
   *
   */
  $scope.getRasterImages = {};
  $scope.getRasterImages = function () {
    $scope.rain.imageDates = [];
    var imageUrlBase = 'https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=demo%3Aradar&STYLES=transparent&FORMAT=image%2Fpng&SRS=EPSG%3A3857&TRANSPARENT=true&HEIGHT=497&WIDTH=525&ZINDEX=20&SRS=EPSG%3A28992&EFFECTS=radar%3A0%3A0.008&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME=';
    // round time to minutes
    if ($scope.timeState.at !== undefined) {
      var utc_formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
      // The rain wms only accepts requests for every 5th minute exact
      // round to nearest 5 minutes
      var coeff = 1000 * 60 * 5;
      var now = parseInt(($scope.timeState.at + (coeff / 2)) / coeff) * coeff;
      // correct for time zone offset in ms
      var timeZoneOffsetMs = (new Date(now)).getTimezoneOffset() * 60 * 1000;
      now = now - timeZoneOffsetMs;
      $scope.rain.currentImage = imageUrlBase + utc_formatter(new Date(now));
    }
  };

// End rain stuff

}]);
