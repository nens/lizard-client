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
  'global-state'
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
   'State',
   'MapService',

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
            versioning,
            State,
            MapService) {

  $scope.user = user;
  $scope.versioning = versioning;

  // KEYPRESS

  // If escape is pressed close box
  // NOTE: This fires the watches too often
  $scope.keyPress = function ($event) {

    if ($event.target.nodeName === "INPUT" &&
      ($event.which !== 27 && $event.which !== 13
       && $event.which !== 32)) {
      return;
    }

    // pressed ESC
    if ($event.which === 27) {

      State.box.type = "point";
      State.spatial.here = undefined;
      State.spatial.points = [];
      ClickFeedbackService.emptyClickLayer(MapService);

      // This does NOT work, thnx to Angular scoping:
      // $scope.geoquery = "";
      //
      // ...circumventing-angular-weirdness teknique:
      document.querySelector("#searchboxinput").value = "";
    }
    // TODO: move
    // // play pause timeline with Space.
    // if ($event.which === 32) {
    //   $scope.timeState.playPauseAnimation();
    // }

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
