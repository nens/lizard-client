'use strict';

/**
 * @class angular.module('lizard-nxt')
  .TimeLineCtrl
 * @memberOf app
 *
 * @summary TimeLine controller.
 *
 * @desc Manipulates timeState model, animation controls.
 *
 */
angular.module('lizard-nxt')
  .controller('TimeCtrl', ["$scope", "$q", "RasterService", 'UtilService',
  function ($scope, $q, RasterService, UtilService) {

  window.requestAnimationFrame = window.requestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame ||
                                 window.msRequestAnimationFrame;

  var DEFAULT_NUMBER_OF_STEPS = 2000, // Small for humans to percieve as smooth.
      currentInterval = $scope.timeState.end - $scope.timeState.start,
      timeStep = Infinity, // Will be overwritten to
                           // currentInterval / DEFAULT_NUMBER_OF_STEPS
                           // Or the smallest temporalResolution of an active
                           // temporal layer.
      minLag = 0, // Let the browser determine the max speed using
                  // requestAnimationFrame.
      promise, // Is created when syncing time and resolves when all datalayers
               // finished buffering and redrawing;
      timeOut; // runs for minLag of milliseconds before waiting for the promise
               // to resolve and re-syncing the data layers to the new time and
               // making a new step when animation is playing.


  /**
   * Keep an eye out for temporal layers that require the animation to go
   * with a lower speed so wms requests can keep up and run more smooth if the
   * temporalResolution equals or is a multiplication of  the stepSize.
   */
  $scope.$watch('mapState.layerGroupsChanged', function (n, o) {
    if (n === o) { return; }
    configAnimation();
  });

  /**
   * sync data layers to new timestate and redo the animation configuration
   * since currentInterval has changed.
   */
  $scope.$watch('timeState.start', function (n, o) {
    if (n === o) { return; }
    configAnimation();
    syncTimeWrapper($scope.timeState);
  });

  /**
   * Sync to new time and trigger a new step when animation.playing is true.
   *
   * Layergroups need a time synced to them before being toggled. Therefore, no
   * n === o return here.
   */
  $scope.$watch('timeState.at', function () {
    syncTimeWrapper($scope.timeState);
  });

  /**
   * @description sets the timeStep and minLag on the basis of layergroups and
   *              their temporalResolution. The temporal layer with the smallest
   *              temporalResolution is leading.
   */
  var configAnimation = function () {
    currentInterval = $scope.timeState.end - $scope.timeState.start;
    timeStep = Infinity;
    minLag = 50;

    angular.forEach($scope.mapState.layerGroups, function (lg) {
      if (lg.isActive() && lg.temporal && lg.temporalResolution < timeStep) {
        timeStep = lg.temporalResolution;
        // equals to 250 ms for 5 minutes, increases for larger timeSteps untill
        // it reaches 1 second between frames for timeSteps of > 20 minutes.
        minLag = timeStep / 1200 > 240 ? timeStep / 1200 : 250;
        minLag = minLag > 1000 ? 1000 : minLag;
      }
    });

    // If no temporal layers were found, set to a default amount.
    if (timeStep === Infinity) {
      timeStep = currentInterval / DEFAULT_NUMBER_OF_STEPS;
    }
  };

  /**
   * @function
   * @memberOf angular.module('lizard-nxt').TimeLineCtrl
   * @summary Toggle animation state.
   * @desc Set $scope.timeState.animation.enabled to true or false.
   *
   * @param {} toggle - .
   *
   */
  $scope.timeState.enableAnimation = function (toggle) {
    $scope.timeState.animation.enabled =
      !($scope.timeState.animation.enabled || toggle === "off");
  };

  /**
   * @function
   * @summary Toggle animation playing.
   * @description Set $scope.timeState.animation.playing to true or false.
   *
   * @param {} toggle - .
   */
  $scope.timeState.playPauseAnimation = function (toggle) {
    var anim = $scope.timeState.animation;
    if (anim.playing || toggle === "off") {
      anim.playing = false;
    } else {
      if (!anim.enabled) {
        $scope.timeState.enableAnimation();
      }
      anim.playing = true;
      window.requestAnimationFrame(step);
    }
  };

  /**
   * @function
   * @summary Push animation 1 step forward when Nxt is ready.
   * @description Set new timeState.at based on stepSize. If current
   * timeSate.at is outside current temporal extent, start animation at start
   * of temporal extent.
   */
  var step =  function () {
    // Make a new step.
    $scope.$apply(function () {
      $scope.timeState.animation.start += timeStep;
      $scope.timeState.at += timeStep;
    });

    // reset timeState.at if out of temporal bounds
    if ($scope.timeState.at >= $scope.timeState.end ||
        $scope.timeState.at < $scope.timeState.start) {
      $scope.$apply(function () {
        $scope.timeState.at = $scope.timeState.start;
        $scope.timeState.animation.start = $scope.timeState.start;
      });
    }
  };

  /**
   * @param  {boolean} onOff boolean to control timeState.buffering
   */
  var toggleBuffer = function (onOff) {
    if (!$scope.$$phase) {
      $scope.$apply(function () {
        $scope.timeState.buffering = onOff;
      });
    }
    else { $scope.timeState.buffering = onOff; }
  };

  /**
   * @description creates a promise by calling syncTime and toggles buffer state
   *              accordingly.
   * @param  {object} timeState nxt timeState object
   */
  var syncTimeWrapper = function (timeState) {
    promise = $scope.mapState.syncTime(timeState);
    if ($scope.timeState.animation.playing) {
      progressAnimation(promise);
    }
    else {
      // If promise is resolved buffering is set to false. If this does not
      // happpen instantly, buffering is set to true.
      promise.then(function () {
        toggleBuffer(false);
      });
      toggleBuffer(true);
    }
  };

  /**
   * @description progresses animation when provided promiss finishes and the
   *              minLag has passed. Sets buffering when he promise is not re-
   *              solved after minLag.
   * @param  {promise} finish
   */
  var progressAnimation = function (finish) {
    // Remove any old timeout
    clearTimeout(timeOut);
    // when the minLag has passed.
    timeOut = setTimeout(function () {
      // And the layergroups are all ready
      finish.then(function () {
        toggleBuffer(false);
        // And the browser is ready.
        if ($scope.timeState.animation.playing) {
          window.requestAnimationFrame(step);
        }
      });
      toggleBuffer(true);
    }, minLag);
  };


  /**
   * @function
   * @summary Move timeState.end to now.
   */
  $scope.timeState.zoomToNow = function () {

    var now = Date.now(),
        fullInterval = $scope.timeState.end - $scope.timeState.start,
        oneFifthInterval = Math.round(fullInterval * 0.2),
        fourFifthInterval = Math.round(fullInterval * 0.8);

    $scope.timeState.start = now - fourFifthInterval;
    $scope.timeState.end = now + oneFifthInterval;
    $scope.timeState.at = UtilService.roundTimestamp(now, $scope.timeState.aggWindow, false);
    $scope.timeState.changeOrigin = 'user';
    $scope.timeState.changedZoom = Date.now();
  };

  /**
   * @function
   * @summary Zooms time in or out.
   * @description multiplies or divides current time resolution by
   * ZOOMFACTOR depending on zooming in or out. Updates start and end
   * of timeState accordingly and sets new resolution on timeState.
   *
   * @param {string} action - 'in' or 'out'.
   */
  $scope.timeState.zoom = function (action) {
    var ZOOMFACTOR = 2;
    var newResolution;

    if (action === 'in') {
      newResolution = $scope.timeState.resolution / ZOOMFACTOR;
    } else if (action === 'out') {
      newResolution = $scope.timeState.resolution * ZOOMFACTOR;
    }

    var milliseconds = window.innerWidth * newResolution;

    $scope.timeState.start = $scope.timeState.at - milliseconds;
    $scope.timeState.end = $scope.timeState.at + milliseconds;
    $scope.timeState.resolution = newResolution;
    $scope.timeState.changeOrigin = 'user';
    $scope.timeState.changedZoom = Date.now();
  };

}]);
