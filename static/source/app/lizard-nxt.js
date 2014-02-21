'use strict';

/**
 * Initialise app.
 */
var app = angular.module("lizard-nxt", [
  'graph',
  'omnibox',
  'restangular',
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
 * * [ ] Refactor map controller and directives
 * * [-] Refactor master controller (states, data!)
 * * [-] Refactor timeline out of mapState with its own scope
 * * [+] Refactor index.html and base-debug.html
 * * [ ] Fix + document Gruntfile.js / workflow
 * * [ ] Refactor css (csslint, -moz and -webkit)
 * * [ ] Move or delete common directory in source
 * * [ ] Integrate 3di into this paradigm (move from threedi to source/app)
 * * [+] Refactor timeline controller and directive
 *
 */
app.controller("MasterCtrl",
  ["$scope", "$http", "Restangular", "$q", "$compile", "CabinetService",
  function ($scope, $http, Restangular, $q, $compile, CabinetService)  {

  // BOX MODEL
  $scope.box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'empty', // NOTE: default, box type is empty
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
    },
    cursorTooltip: {
      enabled: false,
      content: '',
      location: ''
    }
  };

  // $scope.mouseMove = function ($event) {
  //   if ($scope.tools.cursorTooltip.enabled) {
  //     $scope.tools.cursorTooltip.location = $event;
  //   }
  // };

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
    activeBaselayer: 1,
    changed: Date.now(),
    moved: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false,
    bounds: null,
    geom_wkt: ''
  };

  $scope.panZoom = {};
  // /END MOVE TO MAP CONTROL
  // MAP MODEL

  var end = Date.now();
  // TIME MODEL
  $scope.timeState = {
    start: end - (24 * 60 * 60 * 1000 * 250), // 14 days
    end: end - (24 * 60 * 60 * 1000 * 10),
    changedZoom: Date.now(),
    at: this.start,
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
   * Turns event types on or off
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
    if ($scope.timeState.hidden !== false) { $scope.toggleTimeline(); }
  };

  /**
   * Downloads events and asynchronously fires callback
   * 
   * Callback passes the response to addEvents, recolors the event data object,
   * Does bookkeeping and triggers watches by updating events.changed
   * 
   * @param: str containing the name of the event type to download
   */
  var getEvents = function (name) {
/*    CabinetService.events.get({
      type: name,
      start: $scope.timeState.start,
      end: $scope.timeState.end,
      extent: $scope.mapState.bounds
      }, function (response) {
        $scope.timeState.timeline.data[name] = response.results[0];
        $scope.timeState.timeline.data[name].count = response.count;
        $scope.timeState.timeline.data[name].active = true;
        $scope.timeState.timeline.changed = !$scope.timeState.timeline.changed;
      }
    );*/
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
   * Takes a geojson compliant data object which is added to another geojson compliant data object 
   * In order to identify the type of events in the longData object, an eventOrder is added to the features.
   * This eventOrder is also used in the timeline for the yAxis. The indiviudual features also get a id which is used
   * by d3 to identify the events in the update pattern.
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

  // 3Di START
  $scope.setFollow = function (layer, follow_3di) {
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
    };
  // 3Di END

  /**
   * Get data for timeseries
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
    changed: true
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
          // $scope.data =
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
    // rain retrieve
    var stop = new Date($scope.timeState.end);
    var stopString = stop.toISOString().split('.')[0];
    var start = new Date($scope.timeState.start);
    var startString = start.toISOString().split('.')[0];
    var wkt = "POINT(" + $scope.activeObject.latlng.lng + " "
      + $scope.activeObject.latlng.lat + ")";
    $scope.canceler.resolve();
    $scope.canceler = $q.defer();
    // $scope.box.type = "rain";
    CabinetService.raster.get({
      raster_names: 'rain',
      geom: wkt,
      srs: 'EPSG:4236',
      start: startString,
      stop: stopString
    }).then(function (result) {
      $scope.rain.data = result;
      $scope.rain.wkt = wkt;
      $scope.rain.srs = 'EPSG:4236';
    });
  });


  $scope.getData = function () {
    $scope.canceler.resolve();
    $scope.canceler = $q.defer();
    if ($scope.box.content.selected_timeseries) {
      CabinetService.timeseries.one(
        $scope.box.content.selected_timeseries.id + '/'
      ).withHttpConfig({
        timeout: $scope.canceler.promise
      }).get({
        start: $scope.timeState.start,
        end: $scope.timeState.end
      }).then(function (response) {
        $scope.data.data = response.events.instants;
        // $scope.box.content.selected_timeseries.events = response.events;
      });
    }
    if ($scope.rain.data) {
      var stop = new Date($scope.timeState.end);
      var stopString = stop.toISOString().split('.')[0];
      var start = new Date($scope.timeState.start);
      var startString = start.toISOString().split('.')[0];
      CabinetService.raster.withHttpConfig({
        timeout: $scope.canceler.promise
      }).get({
        raster_names: 'rain',
        geom: $scope.rain.wkt,
        srs: $scope.rain.srs,
        start: startString,
        stop: stopString
      }).then(function (result) {
        $scope.rain.data = result;

      });
    }
  };

  $scope.$watch('timeState.changedZoom', function (newVal, oldVal) {
    if ((newVal === oldVal)) { return; }
    $scope.getData();

  });

  // $scope.$watch('box.content.selected_timeseries.id', function () {
  //   if ($scope.box.content.selected_timeseries !== undefined) {
  //     // NOTE: this will change to $scope.selected_timeseries.instants
  //     $scope.data = {
  //         series: $scope.box.content.selected_timeseries.events.series,
  //         instants: $scope.box.content.selected_timeseries.events.instants
  //       };
  //     // dit kan zeker nog mooier
  //     $scope.metadata.title = " - " + $scope.box.content.selected_timeseries.location.name;
  //     $scope.metadata.ylabel = "";//$scope.selected_timeseries.parameter + $scope.selected_timeseries.unit.code
  //     $scope.metadata.xlabel = "Tijd";
  //   } else {
  //     $scope.data = undefined;
  //   }
  // });

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
        } else if (raster_names === 'elevation' && agg === undefined) {
          // var d3data = format_data(data);
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
      $scope.box.type = 'empty';
      $scope.box.empty = null;
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
  * Event enabler
  */
  $scope.toggleTimeline = function () {
    if ($scope.timeState.hidden) {
      $scope.timeState.hidden = false;
      angular.element('#timeline').css('bottom', 0);
    } else if ($scope.timeState.hidden === false) {
      $scope.timeState.hidden = true;
      angular.element('#timeline').css('bottom', 0 - angular.element('#timeline').height());
    } else {
      // Create timeline element when needed and no earlier
      var timeline = angular.element('<timeline class="navbar timeline navbar-fixed-bottom"></timeline>');
      var el = $compile(timeline)($scope);
      angular.element('#master')
        .append(timeline);
      $scope.timeState.hidden = false;
    }
  };


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

  var buildAnimationDatetimes = function () {
        /**
         * Get radarimages for every 5th minutes if this fits in the
         * localstorage, else confine to every 10th minute
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
        $scope.timeState.changeOrigin = 'rain';
        $scope.timeState.changedZoom = !$scope.timeState.changedZoom;
      }
      if ($scope.timeState.end < twentyFourAgo || $scope.timeState.end > Date.now()) {
        $scope.timeState.end =  Date.now();
        $scope.timeState.changeOrigin = 'rain';
        $scope.timeState.changedZoom = !$scope.timeState.changedZoom;
      }
      getRadarImages();
      $scope.rain.enabled = true;
      if ($scope.timeState.hidden !== false) { $scope.toggleTimeline(); }
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
