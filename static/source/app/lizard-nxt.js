'use strict';

/**
 * Initialise app.
 */
var app = angular.module("lizard-nxt", [
  'graph',
  'omnibox',
  'restangular',
  'ui.bootstrap',
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
 * state.mapState => spatial state
 * state.timeState => temporal state
 * state.tools => active tool(s)
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
 * * [+] Create a mapState.here to describe the current spatial location 
 *       just like timeState.at describes the now. map-directive should set this, 
 *       watches should listen to this to draw a clicklayer, get rain, get data from utf, etc.
 * * [ ] Refactor map controller and directives
 * * [-] Refactor master controller (states, data!)
 * * [+] Refactor timeline out of mapState with its own scope
 * * [+] Refactor index.html and base-debug.html
 * * [ ] Fix + document Gruntfile.js / workflow
 * * [ ] Refactor css (csslint, -moz and -webkit)
 * * [ ] Move or delete common directory in source
 * * [+] Refactor timeline controller and directive
 * * [ ] Move event logic to event controller (on event / layer tag)
 * * [+] Move animation logic to animation controller (on timeline tag)

 */
app.controller("MasterCtrl",
  ["$scope", "$http", "$q", "$compile", "CabinetService", "RasterService",
  function ($scope, $http, $q, $compile, CabinetService, RasterService) {

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

  $scope.toggleDetailmode = function () {
    if ($scope.box.detailMode) {
      $scope.box.detailMode = false;
    } else {
      $scope.box.detailMode = true;
    }
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
  // initialise 'now'
  $scope.timeState.at = $scope.timeState.start;

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

  // EVENTS
  
  // EVENTS MODEL
  /**
   * Build object template to hold information per event type.
   * 
   * @param object eventTypes object with event ids
   * @returns  
   */
  var buildEventTypesTemplate = function (eventTypes) {
  
    var eventTypesTemplate = {};
    for (var i = 0; i < eventTypes.length; i++) {
      eventTypesTemplate[eventTypes[i].event_series] = {};
    }
    eventTypesTemplate.count = 0;

    return eventTypesTemplate;
  };

  $scope.events = {
    //TODO: refactor event meta data (remove eventTypes from mapState)
    //types: { count: 0, 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }, // Metadata object
    types: buildEventTypesTemplate($scope.mapState.eventTypes),
    data: { type: "FeatureCollection",
            features: [] // Long format events data object
      },
    scale: d3.scale.ordinal().range($scope.colors[8]),
    changed: Date.now()
  };

  /**
   * Zoom to event location
   * 
   * Used by the aggregate template under the 'screenshot' icon
   * 
   * @param {object} geometry Object wit a list of lon, lat
   */
  $scope.events.zoomTo = function (geometry) {
    var panZoom = {
      lng: geometry.coordinates[0],
      lat: geometry.coordinates[1],
      zoom: 15
    };
    $scope.panZoom = panZoom;
    $scope.mapState.moved = Date.now();
  };
  

  /**
   * Counts the events currently within the temporal and spatial extent
   * 
   * Called when the user pans the map or zooms the timeline.
   * The aggregate directive flags events that are visible on the map at
   * feature.inSpatExtent. The timeline directive flags events that are
   * currently on the map at inTempExtent attribute. This function sums it all
   * up.
   */
  $scope.events.countCurrentEvents = function () {
    var i,
        eventType;
    var typeLength = $scope.mapState.eventTypes.length;
    for (i = 0; i < typeLength; i++) {
      eventType = $scope.mapState.eventTypes[i];
      $scope.events.types[eventType.event_series].currentCount = 0;
    }
    for (i = 0; i < $scope.events.data.features.length; i++) {
      var feature = $scope.events.data.features[i];
      if (feature.inTempExtent && feature.inSpatExtent) {
        $scope.events.types[feature.properties.event_series].currentCount++;
      }
    }
  };

  /**
   * Turns event types on or off.
   * 
   * When an event type is off, it is passed to getEvents.
   * When an event type is on, it is passed to removeEvents and the remaining
   * events are recolored.
   * 
   * @param: str containing the type of the event type to toggle
   */
  $scope.events.toggleEvents = function (eventSeriesId) {
    if ($scope.events.types[eventSeriesId]) {
      if ($scope.events.types[eventSeriesId].active) {
        $scope.events.types[eventSeriesId].active = false;
        $scope.events.data = removeEvents($scope.events.data, eventSeriesId);
        addColor($scope.events.data);
        $scope.events.changed = Date.now();
      } else {
        getEvents(eventSeriesId);
      }
    } else {
      getEvents(eventSeriesId);
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
   * @param: int containing the id of the event series to download
   */
  var getEvents = function (eventSeriesId) {
    CabinetService.events.get({event_series: eventSeriesId})
      .then(function (response) {
        var data = response;
        $scope.events.data = addEvents($scope.events.data, data, eventSeriesId);
        addColor($scope.events.data);
        $scope.events.types[eventSeriesId].count = response.features.length;
        $scope.events.types[eventSeriesId].active = true;
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
   * @param: str containing the type of the event to add
   * @returns: object geojson compliant data object 
   */
  var addEvents = function (longData, shortData, eventSeriesId) {
    // Create event identifier
    var eventOrder;
    if (longData.features === undefined) { longData.features = []; }
    if (longData.features.length === 0) {
      eventOrder = 1;
    } else {
      var maxEventOrder = 0;
      angular.forEach(longData.features, function (feature) {
        maxEventOrder = feature.event_order > maxEventOrder ?
                        feature.event_order : maxEventOrder;
      });
      eventOrder = maxEventOrder + 1;
    }
    $scope.events.types[eventSeriesId] = {};
    $scope.events.types[eventSeriesId].event_type = eventOrder;
    angular.forEach(shortData.features, function (feature) {
      feature.event_order = eventOrder;
      feature.color = $scope.colors[8][eventOrder];
      //feature.event_type = type;
      feature.id = eventSeriesId + feature.properties.timestamp +
                   feature.geometry.coordinates[0] +
                   feature.geometry.coordinates[1];
      longData.features.push(feature);
    });
    $scope.events.types.count = $scope.events.types.count + 1;
    return longData;
  };

  /**
   * Adds a color attribute to features in event data object
   * 
   * Takes a geojson compliant data object and adds a color to all the
   * features. If there is only one event type, the events are colored on the
   * basis of sub_event_type. If there are multiple event types active, the
   * events are colored on the basis of a colorscale on the scope and the type
   * of the feature.
   * 
   * @param: object geojson compliant data object with all the events
   */
  var addColor = function (longData) {
    var scale;
    if ($scope.events.types.count === 1) {
      scale = d3.scale.ordinal().range($scope.colors[8]);
      angular.forEach(longData.features, function (feature) {
        feature.color = scale(feature.properties.category);
      });
    } else {
      angular.forEach(longData.features, function (feature) {
        feature.color = $scope.events.scale(feature.properties.event_series);
      });
    }
  };
  
  /**
   * Removes events from the data object.
   * 
   * Takes a geojson compliant data object and removes the features with the
   * given name. It also removes the metadata of these events and lowers the
   * eventOrder of all the event types which have a order that is greater than
   * the order of the removed event type.
   * 
   * @param: object geojson compliant data object 
   * @param: str containing the type of the event to remove
   * @returns: object geojson compliant data object 
   */
  var removeEvents = function (longData, eventSeriesId) {
    var eventOrder = $scope.events.types[eventSeriesId].event_type;
    var iterations = longData.features.length;
    for (var i = 0; i < iterations; i++) {
      var index = iterations - 1 - i;
      var feature = longData.features[index]; // Go from back to front to not mess with the order
      if (feature.properties.event_series === eventSeriesId) {
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

  // END EVENTS

  // TIMESERIES

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

  // END TIMESERIES

  //TODO: move to raster-service ?

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

  // KEYPRESS

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
    }
  });

  $scope.toggleLayerInfo = function (layername) {
    if (layername === 'Hoogtekaart') {
      $scope.keyPressed = 51;
    } else if (layername === 'Landgebruik') {
      $scope.keyPressed = 52;
    }
  };

  //END KEYPRESS

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

  // RAIN
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
   */
  $scope.toggleRain = function () {
    if ($scope.rain.enabled === false) {
      $scope.getRasterImages($scope.timeState.start);
      $scope.timeState.animation.speed = 5;
      $scope.rain.currentDate = $scope.timeState.start;
      $scope.rain.enabled = true;
      if ($scope.timeState.hidden !== false) {
        $scope.toggleTimeline();
      }
    } else if ($scope.rain.enabled) {
      $scope.rain.enabled = false;
      $scope.timeState.animation.speed = 20;
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
  $scope.getRasterImages = function (timestamp) {
    var rasterName = "rain";
    $scope.rain.images = RasterService.getWMSImages(rasterName, timestamp);
    console.log($scope.rain.images);
  };

  /** 
   * Watch changes in timeState.at, get new raster images, if imageOverlay
   * exists and rain tool is enabled and animation is not playing.
   */
  $scope.$watch('timeState.at', function (newVal, oldVal) {
    if (newVal === oldVal) { return; }
    if ($scope.rain.enabled) {
      var d = new Date();
      var timeZoneOffset = d.getTimezoneOffset() * 60000;
      //var roundedMoment = Math.round($scope.timeState.at / 300000) * 300000 - timeZoneOffset; //Round to nearest five minutes
      var roundedMoment = Math.round($scope.timeState.at / 300000) * 300000 - timeZoneOffset; //Round to nearest five minutes
      console.log($scope.rain.images, roundedMoment);
      if (roundedMoment !== $scope.rain.currentDate &&
        roundedMoment >= ($scope.rain.currentDate + 300000) ||
        roundedMoment <= ($scope.rain.currentDate - 300000)) {
        $scope.rain.currentDate = roundedMoment;
        if ($scope.rain.images[roundedMoment]) { // Check whether we have an image for this moment
          $scope.rain.currentImage = $scope.rain.images[roundedMoment];
          console.log("set image: ", $scope.rain.currentImage);
        } else {
          $scope.getRasterImages(roundedMoment + timeZoneOffset);
        }
      }
    }
  });


  // END RAIN

}]);
