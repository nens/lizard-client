'use strict';

/**
 * TimeLine controller.
 *
 * Manipulates timeState model, animation controls.
 *
 */
app.controller('TimeLine', ["$scope", "$q", "CabinetService",
  function ($scope, $q, CabinetService) {

  // animation
  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  $scope.timeState.enableAnimation = function (toggle) {
    if ($scope.timeState.animation.enabled || toggle === "off") {
      $scope.timeState.animation.enabled = false;
    } else {
      $scope.timeState.animationDriver();
      $scope.timeState.animation.enabled = true;
    }
  };

  $scope.timeState.playPauseAnimation = function (toggle) {
    if (!$scope.timeState.animation.enabled) {
      $scope.timeState.enableAnimation();
    }
    if ($scope.timeState.animation.playing || toggle === "off") {
      $scope.timeState.animation.playing = false;
    } else {
      $scope.timeState.animation.playing = true;
      window.requestAnimationFrame($scope.timeState.step);
    }
  };

  $scope.timeState.step =  function (timestamp) {
    $scope.timeState.timeStep = ($scope.timeState.end - $scope.timeState.start) / $scope.timeState.animation.stepSize;
    $scope.$apply(function () {
      $scope.timeState.animation.start += $scope.timeState.timeStep;
      $scope.timeState.animation.end += $scope.timeState.timeStep;
      $scope.timeState.at = ($scope.timeState.animation.end + $scope.timeState.animation.start) / 2;
    });
    if ($scope.timeState.at >= $scope.timeState.end || $scope.timeState.at < $scope.timeState.start) {
      $scope.$apply(function () {
        $scope.timeState.animation.end = $scope.timeState.animation.end - $scope.timeState.animation.start + $scope.timeState.start;
        $scope.timeState.animation.start = $scope.timeState.start;
        $scope.timeState.at = ($scope.timeState.animation.end + $scope.timeState.animation.start) / 2;
      });
    }
    if ($scope.timeState.animation.playing) {
      setTimeout(function () {
        window.requestAnimationFrame($scope.timeState.step);
      }, 400 - Math.pow($scope.timeState.animation.speed, 2));
    }
  };

  /**
   * Set timeSate.at to start of timeline.
   */
  $scope.timeState.animationDriver = function () {
    $scope.timeState.at = $scope.timeState.start;
  };

  var animationWasOn;
  // Toggle fast-forward
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

  // Step back function
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
      $scope.timeState.at = ($scope.timeState.animation.end + $scope.timeState.animation.start) / 2;
    }
  };

  // END animation
}]);
