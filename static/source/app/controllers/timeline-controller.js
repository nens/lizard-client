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
    if (!$scope.timeState.animation.enabled) {
      $scope.timeState.enableAnimation();
    }
    if ($scope.timeState.animation.playing || toggle === "off") {
      $scope.timeState.animation.playing = false;
    } else {
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
    var timeStep = currentInterval / $scope.timeState.animation.stepSize;
    // hack to slow down animation for rasters to min resolution
    if ($scope.rain.enabled &&
        timeStep - RasterService.rainInfo.timeResolution > 0) {
      var timeFraction = timeStep / RasterService.rainInfo.timeResolution;
      $scope.timeState.animation.speed = 50 - (timeFraction / 2);
      timeStep = RasterService.rainInfo.timeResolution;
    }
    $scope.$apply(function () {
      $scope.timeState.animation.start += timeStep;
      $scope.timeState.animation.end += timeStep;
    });
    if ($scope.timeState.at >= $scope.timeState.end ||
        $scope.timeState.at < $scope.timeState.start) {
      $scope.$apply(function () {
        $scope.timeState.animation.end = $scope.timeState.animation.end -
                                         $scope.timeState.animation.start +
                                         $scope.timeState.start;
        $scope.timeState.animation.start = $scope.timeState.start;
      });
    }
    $scope.timeState.at = $scope.timeState.animation.end;
    if ($scope.timeState.animation.playing) {
      setTimeout(function () {
        window.requestAnimationFrame(step);
      }, 50);
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
    $scope.timeState.animation.end = $scope.timeState.animation.end - stepBack;
    $scope.timeState.playPauseAnimation('off');
    if (!$scope.timeState.animation.playing && wasOn) {
      setTimeout(function () {
        $scope.timeState.playPauseAnimation();
      }, 500);
    } else {
      $scope.timeState.at = ($scope.timeState.animation.end +
                             $scope.timeState.animation.start) / 2;
    }
  };
}]);
