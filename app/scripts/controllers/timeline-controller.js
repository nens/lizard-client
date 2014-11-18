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
  .controller('TimeLine', ["$scope", "$q", "RasterService", 'UtilService',
  function ($scope, $q, RasterService, UtilService) {

  window.requestAnimationFrame = window.requestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame ||
                                 window.msRequestAnimationFrame;


  var now = Date.now(),
      hour = 60 * 60 * 1000;

  // TIME MODEL
  $scope.timeState = {
    start: now - 4 * hour,
    end: now + hour,
    at: now - 4 * hour,
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

  var DEFAULT_NUMBER_OF_STEPS = 1000;
  var currentInterval = $scope.timeState.end - $scope.timeState.start;
  var timeStep = 1000 * 60 * 5;  //currentInterval / DEFAULT_NUMBER_OF_STEPS;
  var minLag = 500;

  $scope.$watch('mapState.layerGroupsChanged', function () {
    currentInterval = $scope.timeState.end - $scope.timeState.start;
    timeStep = currentInterval / DEFAULT_NUMBER_OF_STEPS;
    minLag = 50;

    angular.forEach($scope.mapState.layerGroups, function (lg) {
      console.log(lg.slug, lg.temporalResolution, timeStep);
      if (lg.isActive()
        && lg.temporalResolution < timeStep
        && lg.temporalResolution > 0) {
        timeStep = lg.temporalResolution;

        minLag = 200;
      }
    });

    if (timeStep > 3600000) { minLag = 500; }
    console.log(timeStep);
  });

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
   * @summary Push animation 1 step forward.
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

    var promise = $scope.mapState.syncTime($scope.timeState);

    if ($scope.timeState.animation.playing) {
      // when the minlag has passed.
      setTimeout(function () {
        // And the layergroups are all ready
        promise.then(function () {
          console.log('nxt step!');
          $scope.timeState.buffering = false;
          // And the browser is ready.
          window.requestAnimationFrame(step);
        });
        $scope.$apply(function () {
          $scope.timeState.buffering = true;
        });
      }, minLag);
    }
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
    $scope.timeState.at = now;
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
