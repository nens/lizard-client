'use strict';

/**
 * Setup Raven if available.
 * Raven is responsible for logging to https://sentry.lizard.net
 */
if (window.RavenEnvironment) {
  window.Raven.config(window.RavenEnvironment,
  {
    // limits logging to staging and prd
    whitelistUrls: [/integration\.nxt\.lizard\.net/,
                    /nxt\.lizard\.net/,
                    /staging\.nxt\.lizard\.net/]
  }).install();
}

/**
 * Initialise angular.module('lizard-nxt')
 *
 */
angular.module("lizard-nxt", [
  'omnibox',
  'restangular',
  'ngCsv'
])
// Decorator for ngExceptionHandler to log exceptions to sentry
  .config(function ($provide) {
  $provide.decorator("$exceptionHandler", function ($delegate) {
      return function (exception, cause) {
          $delegate(exception, cause);
          window.Raven.captureException(exception, {
            extra: {cause: cause}
          });
        };
    });
});

/**
 * Change default angular tags to prevent collision with Django tags.
 */
angular.module('lizard-nxt')
  .config(function ($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
});

/**
 * Set url fragment behavior to HTML5 mode (without hash in url).
 */
angular.module('lizard-nxt')
  .config(function ($locationProvider) {
  $locationProvider.html5Mode(true);
});

/**
 * @name dataLayers
 * @memberOf app
 * @description Contains the dataLayers set by the server. Used by the
 *              map-directive and layer-chooser directive to build layer
 *              groups.
 */
angular.module('lizard-nxt')
  .constant('dataLayers', window.data_layers);

/**
 * @name dataBounds
 * @memberOf app
 * @description Contains the bounds of the data set by the server at load
 */
angular.module('lizard-nxt')
  .constant('dataBounds', window.data_bounds);

/**
 * @name user
 * @memberOf app
 * @description User and auth stuff
 */
angular.module('lizard-nxt')
  .constant('user', window.user);

/**
 * @name versioning
 * @memberOf app
 * @description User and auth stuff
 */
angular.module('lizard-nxt')
  .constant('versioning', window.versioning);

/**
 *
 * @name MasterController
 * @class MasterCtrl
 * @memberOf app
 * @requires UtilService
 * @requires EventService
 * @requires CabinetService
 * @requires RasterService
 *
 * @summary Master controller
 *
 * @description
 * ## Overview
 *
 * Defines general models and gets data from server; functions that are not
 * relevant for rootscope live in their own controller
 *
 * Directives watch models in MasterCtrl and respond to changes in those models
 * for example, a user zooms in on the timeline, the timeline directive sets
 * the temporal.extent on the state.temporal; a map directive watches
 * state.temporal and updates map objects accordingly.
 *
 * ## Models
 *
 * Application state >> link to state property in this module.
 *
 * state.mapState => spatial state
 * state.timeState => temporal state
 * state.tools => active tool(s)
 * user.profile
 *
 * Data >> link to data properties in this module.
 * data.active
 * data.objects
 * data.events
 * data.timeseries
 * data.aggregates
 *
 * ## TODO / Refactor
 *
 * Stuff to reconsider, rethink, refactor:
 *
 * - [ ] Refactor map controller and directives
 * - [-] Refactor master controller (states, data!)
 * - [+] Refactor timeline out of mapState with its own scope
 * - [+] Refactor index.html and base-debug.html
 * - [ ] Fix + document Gruntfile.js / workflow
 * - [ ] Refactor css (csslint, -moz and -webkit)
 * - [ ] Move or delete common directory in source
 * - [+] Refactor timeline controller and directive
 * - [ ] Move event logic to event controller (on event / layer tag)
 * - [+] Move animation logic to animation controller (on timeline tag)

 */
angular.module('lizard-nxt')
  .controller('MasterCtrl',

  ['$scope',
   '$http',
   '$q',
   '$filter',
   '$compile',
   'CabinetService',
   'RasterService',
   'UtilService',
   'TimeseriesService',
   'ClickFeedbackService',
   'user',
   'versioning',

  function ($scope,
            $http,
            $q,
            $filter,
            $compile,
            CabinetService,
            RasterService,
            UtilService,
            TimeseriesService,
            ClickFeedbackService,
            user,
            versioning) {

  $scope.user = user;
  $scope.versioning = versioning;

  var MIN_TIME_FOR_EXTENT = (new Date(2010, 0, 0, 0, 0, 0, 0)).getTime();
  var MAX_TIME_FOR_EXTENT = (new Date(2015, 0, 0, 0, 0, 0, 0)).getTime();

  // BOX MODEL
  /**
   * @memberOf angular.module('lizard-nxt')
  .MasterCtrl
   * @summary Box model
   *
   * @description Box model holds properties to render the omnibox.
   *
   * @property {object} box - Box model
   * @property {boolean} box.detailMode - Detail mode, defaults to false.
   */
  $scope.box = {
    contextSwitchMode: false, // Switch between card or fullscreen
    query: null, // Search bar query
    showCards: false,// Only used for search results
    type: 'point', // Default box type
    //type: undefined, // Should this be set via the hashGetterSetter????
    content: {}, // Inconsistently used to store data to display in box
    changed: Date.now(),
    mouseLoc: [] // Used to draw 'bolletje' on elevation profile
  };
  // BOX MODEL

  // TOOLS
  $scope.tools = {
    active: 'point', //NOTE: make list?
  };

  $scope.tooltips = CabinetService.tooltips;

  /**
   * @function
   * @memberOf angular.module('lizard-nxt')
  .MasterCtrl
   *
   * @summary Toggle tool from "name" to "none".
   *
   * @desc Sets tool.active model on scope to name of the tool if tool disabled
   * or "none" if tool is already enabled.
   *
   * @param {string} name name of the tool to toggle
   *
   */
  $scope.toggleTool = function (name) {

    if (["point", "line", "area"].indexOf(name) > -1) {
      $scope.box.type = name;
    } else {
      throw new Error("Attemped to assign an illegal value ('"
        + name
        + "') to $scope.box.type. Only 'point', 'line' and 'area' are accepted values."
      );
    }
  };

  /**
   * Switch between contexts.
   *
   * @param {string} context - Context name to switch to
   */
  //$scope.switchContext = function (context) {
    //$scope.box.context = context;
  //};

  // MAP MODEL is set by the map-directive
  $scope.mapState = {};

  // TODO: check what this does
  $scope.$watch('mapState.here', function (n, o) {
    if (n === o) { return true; }

    var fn = function () {
      if ($scope.box.type === 'point') {
        $scope.box.type = 'point';
        $scope.$broadcast('updatepoint');
      }
    };

    if (!$scope.$$phase) {
      $scope.$apply(fn);
    } else {
      fn();
    }
  });

  // TIME MODEL
  var now = Date.now(),
      hour = 60 * 60 * 1000,
      day = 24 * hour;

  $scope.timeState = {
    start: now - 6 * day,
    end: now + day,
    at: Math.round(now - 2.5 * day),
    changedZoom: Date.now(),
    zoomEnded: null,
    aggWindow: 1000 * 60 * 5,
    animation: {
      playing: false,
      enabled: false,
    }
  };

  $scope.timeState.aggWindow = UtilService.getAggWindow(
    $scope.timeState.start,
    $scope.timeState.end,
    window.innerWidth
  );
  // END TIME MODEL

  /**
   * Watch to restrict values of timeState.
   */
  $scope.$watch('timeState.changedZoom', function (n, o) {
    if (n === o || $scope.timeState.changeOrigin === 'master') { return true; }
    if ($scope.timeState.start < MIN_TIME_FOR_EXTENT) {
      $scope.timeState.changeOrigin = 'master';
      $scope.timeState.start = MIN_TIME_FOR_EXTENT;
    }
    if ($scope.timeState.end > MAX_TIME_FOR_EXTENT) {
      $scope.timeState.changeOrigin = 'master';
      $scope.timeState.end = MAX_TIME_FOR_EXTENT;
    }
  });

  $scope.$watch('box.type', function (n, o) {
    UtilService.addNewStyle(
      "#map * {cursor:" + (n === "line" ? "crosshair" : "") + ";}"
    );
  });

  //TODO: move to raster-service ?

  $scope.raster = {
    changed: Date.now()
  };

  // KEYPRESS

  // If escape is pressed close box
  // NOTE: This fires the watches too often
  $scope.keyPress = function ($event) {

    if ($event.target.nodeName === "INPUT" &&
      ($event.which !== 27 && $event.which !== 13
       && $event.which !== 32)) {
      return;
    }

    if ($event.which === 27) {
      // If detailMode is active, close that
      if ($scope.box.contextSwitchMode) {
        // this shouldn't matter until dates gte 01-12-2014
        $scope.box.contextSwitchMode = false;
      } else {
        // Or else, reset the omnibox AND searchbar state:

        $scope.box.type = "point";
        $scope.box.content = {};
        $scope.mapState.here = undefined;
        $scope.mapState.points = [];
        ClickFeedbackService.emptyClickLayer($scope.mapState);

        // This does NOT work, thnx to Angular scoping:
        // $scope.geoquery = "";
        //
        // ...circumventing-angular-weirdness teknique:
        document.querySelector("#searchboxinput").value = "";
      }
    }

    // play pause timeline with Space.
    if ($event.which === 32) {
      $scope.timeState.playPauseAnimation();
    }

  };

  $scope.toggleVersionVisibility = function () {
    $('.navbar-version').toggle();
  };

  UtilService.preventOldIEUsage();

  // catch window.load event
  window.addEventListener("load", function () {
    window.loaded = true;
  });

}]);
