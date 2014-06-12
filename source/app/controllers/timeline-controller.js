'use strict';

/**
 * TimeLine controller.
 *
 * Manipulates timeState model, animation controls.
 *
 */
app.controller('TimeLine', ["$scope", "$q", "RasterService",
  function ($scope, $q, RasterService) {

  window.requestAnimationFrame = window.requestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame ||
                                 window.msRequestAnimationFrame;

  /**
   * Toggle animation state.
   *
   * Set $scope.timeState.animation.enabled to true or false.
   */
  $scope.timeState.enableAnimation = function (toggle) {
    if ($scope.timeState.animation.enabled || toggle === "off") {
      $scope.timeState.animation.enabled = false;
    } else {
      $scope.timeState.animation.enabled = true;
    }
  };

  /**
   * Toggle animation playing.
   *
   * Set $scope.timeState.animation.playing to true or false.
   */
  $scope.timeState.playPauseAnimation = function (toggle) {
    if ($scope.timeState.animation.playing || toggle === "off") {
      $scope.timeState.animation.playing = false;
    } else {
      if (!$scope.timeState.animation.enabled) {
        $scope.timeState.enableAnimation();
      }
      $scope.timeState.animation.playing = true;
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
    // hack to slow down animation for rasters to min resolution
    if ($scope.rain.enabled) {
      // Divide by ten to make the movement in the timeline smooth.
      timeStep = RasterService.rainInfo.timeResolution / 10;
      $scope.timeState.animation.minLag = RasterService.rainInfo.minTimeBetweenFrames / 10;
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
   * Toggle fast-forward.
   *
   * Speed up animation by a factor 4.
   */
  var animationWasOn;
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

  /**
   * Step back function.
   */
  $scope.timeState.animation.stepBack = function () {
    var stepBack = ($scope.timeState.end - $scope.timeState.start) / 10;
    var wasOn = $scope.timeState.animation.playing;
    $scope.timeState.animation.start = $scope.timeState.animation.start - stepBack;
    $scope.timeState.at = $scope.timeState.at - stepBack;
    $scope.timeState.playPauseAnimation('off');
    if (!$scope.timeState.animation.playing && wasOn) {
      setTimeout(function () {
        $scope.timeState.playPauseAnimation();
      }, 500);
    }
  };

  /**
   * Move timeState.end to now.
   */
  $scope.timeState.zoomToNow = function () {
    $scope.timeState.end = Date.now();
    $scope.timeState.changeOrigin = 'user';
    $scope.timeState.changedZoom = Date.now();
  };

}]);
