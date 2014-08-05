'use strict';

/**
 * Initialise app.
 */
var app = angular.module("lizard-nxt", [
  'graph',
  'omnibox',
  'restangular',
  'ngSanitize',
  'ngCsv',
  'ui.bootstrap',
  'ui.utils',
  'ngTable'
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
  ["$scope", "$http", "$q", "$filter", "$compile", "CabinetService", "RasterService",
   "UtilService", "EventService", "TimeseriesService", "ngTableParams",
  function ($scope, $http, $q, $filter, $compile, CabinetService, RasterService,
            UtilService, EventService, TimeseriesService, ngTableParams) {

  $scope.toggleThisCard = UtilService.toggleThisCard;

  // BOX MODEL
  $scope.box = {
    contextSwitchMode: false, // Switch between card or fullscreen
    query: null, // Search bar query
    showCards: false,// Only used for search results
    type: 'extentAggregate', // Default box type
    content: {}, // Inconsistently used to store data to display in box
    changed: Date.now(),
    mouseLoc: [] // Used to draw 'bolletje' on elevation profile
  };
  // BOX MODEL

  // TOOLS
  $scope.tools = {
    active: "none", //NOTE: make list?
  };

  // START placeholder translations for django i8n
  // because all templates are now refactored
  $scope.translations = {
    'bridge': 'Brug',
    'channel': 'Kanaal',
    'crossprofile': 'Kruisprofiel',
    'culvert': 'Duiker',
    'manhole': 'Put',
    'measuringstation': 'Meetstation',
    'orifice': 'Doorlaat',
    'outlet': 'Uitlaat met keerklep',
    'overflow': 'Overstort',
    'pipe': 'Gesloten Leiding',
    'pumpstation': 'Gemaal',
    'pumpstation_sewerage': 'Rioolgemaal'
  };

  $scope.gettext = function (text) {
    return $scope.translations[text];
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
      $scope.tools.active = 'none';
      $scope.box.type = 'extentAggregate';
    } else {
      $scope.tools.active = name;
    }
  };

  /**
   * Switch between contexts.
   *
   * @param {string} context - Context name to switch to
   */
  $scope.switchContext = function (context) {
    $scope.box.context = context;
  };

  $scope.toggleContextSwitchMode = function () {
    $scope.box.contextSwitchMode = !$scope.box.contextSwitchMode;
  };

  // TOOLS

  // MAP MODEL
  // MOVE TO MAP CONTROL ?
  $scope.mapState = {
    layers: CabinetService.layers,
    activeLayersChanged: false,
    eventTypes: CabinetService.eventTypes,
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

  var now = Date.now();
  var day = 24 * 60 * 60 * 1000;
  var tomorrow = now + day;
  var twoDaysAgo = now - 2 * day;
  var sevenDaysAgo = now - 7 * day;
  var lastVisit = CabinetService.lastVisitUtime;
  var start = Math.max(sevenDaysAgo, Math.min(twoDaysAgo, lastVisit)) || sevenDaysAgo;
  // TIME MODEL
  $scope.timeState = {
    start: start,
    end: tomorrow,
    changedZoom: Date.now(),
    zoomEnded: null,
    hidden: undefined,
    animation: {
      start: undefined,
      playing: false,
      enabled: false,
      currentFrame: 0,
      lenght: 0,
      minLag: 50, // Time in ms between frames
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

  // EVENTS

  // EVENTS MODEL
  $scope.events = {
    //TODO: refactor event meta data (remove eventTypes from mapState)
    //types: { count: 0, 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }, // Metadata object
    types: EventService.buildEventTypesTemplate($scope.mapState.eventTypes),
    data: { type: "FeatureCollection",
            features: [] // Long format events data object
      },
    scale: d3.scale.ordinal().range(EventService.colors[8]),
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
        $scope.events.data = EventService.removeEvents($scope.events.types,
                                                       $scope.events.data,
                                                       eventSeriesId);
        $scope.events.types.count = $scope.events.types.count - 1;
        EventService.addColor($scope.events);
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
    EventService.getEvents({event_series: eventSeriesId})
      .then(function (response) {
        var dataOrder = EventService.addEvents($scope.events.data, response,
                                               eventSeriesId);
        $scope.events.data = dataOrder.data;
        $scope.events.types[eventSeriesId].event_type = dataOrder.order;
        $scope.events.types.count = $scope.events.types.count + 1;
        EventService.addColor($scope.events);
        $scope.events.types[eventSeriesId].active = true;
        $scope.events.changed = Date.now();
      });
  };
  // END EVENTS

  //TODO: move to raster-service ?

  $scope.raster = {
    changed: Date.now()
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
      if ($scope.box.contextSwitchMode) {
        $scope.box.contextSwitchMode = false;
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
   *   true: timeline exists and is shown.
   *
   * Initial state of the timeState.hidden is 'undefined'.
   */
  $scope.toggleTimeline = function () {
    if ($scope.timeState.hidden === true) {
      $scope.timeState.hidden = false;
      angular.element('#timeline').css('bottom', 0);
    } else if ($scope.timeState.hidden === false) {
      $scope.timeState.hidden = true;
      angular.element('#timeline').css(
        'bottom', 0 - angular.element('#timeline').height());
    } else if ($scope.timeState.hidden === undefined) {
      // Create timeline element when needed and no earlier
      var timeline = angular.element(
        '<timeline class="navbar timeline navbar-fixed-bottom"></timeline>');
      var el = $compile(timeline)($scope);
      angular.element('#master')
        .append(timeline);
      $scope.timeState.hidden = false;
    }
  };

  // RAIN
  /**
   * Switch rain tool on or off.
   *
   * Switches rain tool; get raster images, adjust animation speed, show
   * timeline.
   */
  $scope.toggleRain = function () {
    if ($scope.timeState.hidden !== false) {
      $scope.toggleTimeline();
    }
    $scope.toggleTool('rain');
  };

  // END RAIN

}]);
