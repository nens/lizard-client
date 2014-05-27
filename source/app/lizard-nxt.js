'use strict';

/**
 * Initialise app.
 */
var app = angular.module("lizard-nxt", [
  'graph',
  'omnibox',
  'restangular',
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
   "UtilService", "EventService", "ngTableParams",
  function ($scope, $http, $q, $filter, $compile, CabinetService, RasterService,
            UtilService, EventService, ngTableParams) {
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
    start: 1389803883000,
    end: 1389872283000,
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

  $scope.kpiTableParams = new ngTableParams({
      page: 1,            // show first page
      count: 10           // count per page
  }, {
      total: $scope.mapState.eventTypes.length,
      counts: [],
      groupBy: function(item) {
        return item.type + ' (' + item.event_count + ' totaal, ' + $scope.events.types.count + ' actief)'; //TODO: Active doesnt update?
      },
      getData: function($defer, params) {
        // use build-in angular filter
        console.log('--->',$scope.events.data);
        var orderedData = params.sorting() ?
                            $filter('orderBy')($scope.mapState.eventTypes, params.orderBy()) :
                            $scope.mapState.eventTypes;

        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
  });

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
        EventService.addColor($scope.events.data, $scope.events.types.count, $scope.events.scale);
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
        var data = response;
        var dataOrder = EventService.addEvents($scope.events.data, data, eventSeriesId);
        $scope.events.data = dataOrder.data;
        $scope.events.types[eventSeriesId] = {};
        $scope.events.types[eventSeriesId].event_type = dataOrder.order;
        $scope.events.types.count = $scope.events.types.count + 1;
        EventService.addColor($scope.events.data, $scope.events.types.count, $scope.events.scale);
        $scope.events.types[eventSeriesId].count = response.features.length;
        $scope.events.types[eventSeriesId].active = true;
        $scope.events.changed = Date.now();
      });
  };
  // END EVENTS


  // ActiveObject part

  /**
   * ActiveObject is the object which is currently active in the 
   * application. Commonly set by a click on the utf grid. The 
   * activeObject may have associated events and timeseries which
   * may be requested from the server. 
   */
  $scope.activeObject = {
    changed: true, // To trigger the watch
    details: false, // To display details in the card
    attrs: undefined, // To store object data
    events: [],
    timeseries: []
  };

  $scope.$watch('activeObject.changed', function (newVal, oldVal) {
    if (newVal === oldVal) { return; }
    $scope.box.content.object_type = $scope.activeObject.attrs.entity_name;
    $scope.box.content.id = $scope.activeObject.attrs.id;
    $scope.box.content.data = $scope.activeObject.attrs;
    $scope.box.type = $scope.activeObject.attrs.entity_name;
    EventService.getEventsForObject($scope.activeObject.attrs.entity_name,
                                    $scope.activeObject.attrs.id)
    .then(function (response) {
      $scope.activeObject.events = [];
      angular.forEach(response.features, function (feature) {
        feature.properties.geometry = feature.geometry;
        $scope.activeObject.events.push(feature.properties);
      });
      console.log($scope.activeObject);

      $scope.tableParams = new ngTableParams({
          page: 1,            // show first page
          count: 10          // count per page
      }, {
          groupBy: 'category',
          total: $scope.activeObject.events.length,
          getData: function ($defer, params) {
              var orderedData = params.sorting() ?
                      $filter('orderBy')($scope.activeObject.events, $scope.tableParams.orderBy()) :
                      $scope.activeObject.events;

              $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          }
      });
    });
  });

  // END activeObject part

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
   * Initial state 
   */
  $scope.rain = {
    enabled: false,
  };

  /**
   * Switch rain tool on or off.
   *
   * Switches rain tool; get raster images, adjust animation speed, show
   * timeline.
   */
  $scope.toggleRain = function () {
    if ($scope.rain.enabled === false) {
      $scope.rain.enabled = true;
      $scope.timeState.animation.speed = 50;
      if ($scope.timeState.hidden !== false) {
        $scope.toggleTimeline();
      }
    } else if ($scope.rain.enabled) {
      $scope.rain.enabled = false;
      $scope.timeState.animation.speed = 20;
    }
  };

  // END RAIN

}]);
