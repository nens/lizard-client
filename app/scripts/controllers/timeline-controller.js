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
  .controller('TimeLine', ["$scope", "$q", "RasterService",
  function ($scope, $q, RasterService) {

  window.requestAnimationFrame = window.requestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame ||
                                 window.msRequestAnimationFrame;

  /**
   * @function
   * @memberOf angular.module('lizard-nxt').TimeLineCtrl
   *
   * @summary Toggle animation state.
   *
   * @desc Set $scope.timeState.animation.enabled to true or false.
   */
  $scope.timeState.enableAnimation = function (toggle) {
    $scope.timeState.animation.enabled =
      !($scope.timeState.animation.enabled || toggle === "off");
  };

  /**
   * Toggle animation playing.
   *
   * Set $scope.timeState.animation.playing to true or false.
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
   * Push animation 1 step forward.
   *
   * Set new timeState.at based on stepSize. If current timeSate.at is outside
   * current temporal extent, start animation at start of temporal extent.
   */
  var step =  function () {

    var currentInterval = $scope.timeState.end - $scope.timeState.start;
    var timeStep;
    var activeTemporalLG = $scope.mapState.getActiveTemporalLayerGroup();

    // hack to slow down animation for rasters to min resolution

    if (activeTemporalLG) {

      // Divide by ten to make the movement in the timeline smooth.

      timeStep = RasterService.getTimeResolution(activeTemporalLG);
      $scope.timeState.animation.minLag =
        RasterService.getMinTimeBetweenFrames(activeTemporalLG);

    } else {

      timeStep = currentInterval / $scope.timeState.animation.stepSize;
      $scope.timeState.animation.minLag = 50;
    }

    $scope.$apply(function () {
      $scope.timeState.animation.start += timeStep;
      $scope.timeState.at += timeStep;
    });

    if ($scope.timeState.at >= $scope.timeState.end ||
        $scope.timeState.at < $scope.timeState.start) {
      $scope.$apply(function () {
        $scope.timeState.at = $scope.timeState.at -
                                         $scope.timeState.animation.start +
                                         $scope.timeState.start;
        $scope.timeState.animation.start = $scope.timeState.start;
      });
    }

    if ($scope.timeState.animation.playing) {
      setTimeout(function () {
        window.requestAnimationFrame(step);
      }, $scope.timeState.animation.minLag);
    }
  };

  /**
   * Move timeState.end to now.
   */
  $scope.timeState.zoomToNow = function () {
    var now = Date.now();
    var day = 24 * 60 * 60 * 1000;
    var tomorrow = now + day;
    var sevenDaysAgo = now - 7 * day;
    $scope.timeState.start = sevenDaysAgo;
    $scope.timeState.end = tomorrow;
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
   * @param {string} action - 'in' or 'out'
   */
  $scope.timeState.zoom = function (action) {
    console.log("zoom time ", action, $scope.timeState.resolution);
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
