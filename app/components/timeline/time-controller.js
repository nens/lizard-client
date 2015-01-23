'use strict';

/**
 * @class angular.module('lizard-nxt')
  .TimeLineCtrl
 * @memberOf app
 *
 * @summary TimeLine controller.
 *
 * @TODO : Isolate scope. Use scope for data binding to DOM elements. No need to
 *         do this on master scope.
 *
 * @desc Manipulates timeState model, animation controls.
 *
 */
angular.module('lizard-nxt')
.controller('TimeCtrl', [

  "$scope",
  "$q",
  "RasterService",
  'UtilService',
  'DataService',
  'State',

  function (

    $scope,
    $q,
    RasterService,
    UtilService,
    DataService,
    State) {

    window.requestAnimationFrame = window.requestAnimationFrame ||
                                   window.mozRequestAnimationFrame ||
                                   window.webkitRequestAnimationFrame ||
                                   window.msRequestAnimationFrame;

    var DEFAULT_NUMBER_OF_STEPS = 2000, // Small for humans to perceive as smooth.
        currentInterval = State.temporal.end - State.temporal.start,
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

    State.temporal.aggWindow = UtilService.getAggWindow(
      State.temporal.start,
      State.temporal.end,
      UtilService.getCurrentWidth()
    );

    this.state = State.temporal;
    this.layerGroups = State.layerGroups;

    /**
     * Keep an eye out for temporal layers that require the animation to go
     * with a lower speed so wms requests can keep up and run more smooth if the
     * temporalResolution equals or is a multiplication of  the stepSize.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return; }
      configAnimation.call(this);
    });

    /**
     * sync data layers to new timestate and redo the animation configuration
     * since currentInterval has changed.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      if (!State.temporal.timelineMoving) {
        configAnimation();
      }
    });

    /**
     * Sync to new time and trigger a new step when animation.playing is true.
     *
     * Layergroups need a time synced to them before being toggled. Therefore, no
     * n === o return here.
     */
    $scope.$watch(State.toString('temporal.at'), function (n, o) {
      if (n === o) { return true; }
      syncTimeWrapper(State.temporal);
    });

    /**
     * @description sets the timeStep and minLag on the basis of layergroups and
     *              their temporalResolution. The temporal layer with the smallest
     *              temporalResolution is leading.
     */
    var configAnimation = function () {
      currentInterval = State.temporal.end - State.temporal.start;
      timeStep = Infinity;
      minLag = 0;

      var activeTemporalLgs = false;

      angular.forEach(State.layerGroups.active, function (lgSlug) {
        var lg = DataService.layerGroups[lgSlug];

        if (lg.temporal) {
          // add some empty stuff to determine
          // whether animation is possible.
          activeTemporalLgs = true;
        }

        if (lg.temporal && lg.temporalResolution !== 0 && lg.temporalResolution < timeStep) {
          timeStep = lg.temporalResolution;
          // To accomadate dynamic temporal resolutions check all maplayers and
          // switch to coarser resolution if found. This is used by the rain.
          angular.forEach(lg.mapLayers, function (layer) {
            if (layer._temporalResolution > timeStep) {
              timeStep = layer._temporalResolution;
            }
          });
          // equals to 250 ms for 5 minutes, increases for larger timeSteps untill
          // it reaches 1 second between frames for timeSteps of > 20 minutes.
          minLag = timeStep / 1200 > 240 ? timeStep / 1200 : 250;
          minLag = minLag > 1000 ? 1000 : minLag;
        }
      });

      $scope.timeline.animatable = activeTemporalLgs;
      // Do not continue animating when there is nothing to animate.
      if (!$scope.timeline.animatable) {
        State.temporal.playing  = false;
      }

      // If no temporal layers were found, set to a default amount.
      if (timeStep === Infinity) {
        timeStep = currentInterval / DEFAULT_NUMBER_OF_STEPS;
      }
    };

    /**
     * @function
     * @summary Toggle animation playing.
     * @description Set State.temporal.animation.playing to true or false.
     *
     * @param {} toggle - .
     */
    this.playPauseAnimation = function (toggle) {
      if (State.temporal.playing || toggle === "off") {
        State.temporal.playing = false;
      } else {
        State.temporal.playing = true;
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
        State.temporal.at += timeStep;
      });

      // reset timeState.at if out of temporal bounds
      if (State.temporal.at >= State.temporal.end ||
          State.temporal.at < State.temporal.start) {
        $scope.$apply(function () {
          State.temporal.at = State.temporal.start;
        });
      }
    };

    /**
     * @description creates a promise by calling syncTime and toggles buffer state
     *              accordingly.
     * @param  {object} timeState nxt timeState object
     */
    var syncTimeWrapper = function (timeState) {
      var defer = $q.defer();

      if (timeState.playing) {
        progressAnimation(defer.promise);
      }
      if (State.layerGroups.timeIsSyncing) {
        var watch = $scope.$watch(
          function () { return State.layerGroups.timeIsSyncing; },
          function (loading) {
            if (loading === false) {
              defer.resolve();
              watch();
            }
          }
        );
      } else {
        defer.resolve();
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
        // And the layergroups are all ready.
        finish.then(function () {
          // And we are still animating.
          if (State.temporal.playing) {
            // And the browser is ready. GO!
            window.requestAnimationFrame(step);
          }
        });
      }, minLag);
    };


    /**
     * @function
     * @summary Move timeState.end to now.
     */
    this.zoomToNow = function () {

      var now = Date.now(),
          fullInterval = State.temporal.end - State.temporal.start,
          oneFifthInterval = Math.round(fullInterval * 0.2),
          fourFifthInterval = Math.round(fullInterval * 0.8);

      State.temporal.start = now - fourFifthInterval;
      State.temporal.end = now + oneFifthInterval;
      State.temporal.at = UtilService.roundTimestamp(now, State.temporal.aggWindow, false);

      // Without this $broadcast, timeline will not sync to State.temporal:
      $scope.$broadcast("$timelineZoomSuccess");
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
    this.zoom = function (action) {

      var ZOOMFACTOR = 2,
          newResolution;

      newResolution = action === "in"
        ? State.temporal.resolution / ZOOMFACTOR
        : State.temporal.resolution * ZOOMFACTOR;

      var milliseconds = UtilService.getCurrentWidth() * newResolution;

      State.temporal.start = Math.max(State.temporal.at - milliseconds,
                                      UtilService.MIN_TIME);
      State.temporal.end = Math.min(State.temporal.at + milliseconds,
                                    UtilService.MAX_TIME);
      State.temporal.resolution = newResolution;

      // Without this $broadcast, timeline will not sync to State.temporal:
      $scope.$broadcast("$timelineZoomSuccess");
    };

  }
]);
