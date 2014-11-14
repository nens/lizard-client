'use strict';

/**
 * Map directive
 *
 * Overview
 * ========
 *
 * Defines the map. Directive does all the watching and DOM binding, MapDirCtrl
 * holds all the testable logic. Ideally the directive has no logic and the
 * MapDirCtrl is independent of the rest of the application.
 *
 */
angular.module('lizard-nxt')
  .directive('map', [
  '$controller',
  'ClickFeedbackService',
  'NxtMap',
  'dataLayers',
  function ($controller, ClickFeedbackService, NxtMap, dataLayers) {

    var link = function (scope, element, attrs) {

       /**
        * @function
        * @memberOf app.map
        * @description small clickhandler for leafletclicks
        * @param  {event}  e Leaflet event object
        */
      var _clicked = function (e) {
        scope.mapState.here = e.latlng;
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveStarted = function (e) {
        scope.mapState.mapMoving = true;
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _mouseMoved = function (e) {
        if (scope.box.type === 'line') {
          scope.mapState.userHere = e.latlng;
        }
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveEnded = function (e, map) {
        scope.mapState.moved = Date.now();
        scope.mapState.mapMoving = false;
        scope.mapState.center = map.getCenter();
        scope.mapState.zoom = map.getZoom();
        scope.mapState.bounds = map.getBounds();
      };

      scope.mapState = new NxtMap(
        element[0],
        dataLayers,
        {
          zoomControl: true
        }
      );

      scope.mapState.initiateNxtMapEvents(_clicked, _moveStarted, _moveEnded, _mouseMoved);

      // Instantiate the controller that updates the hash url after creating the
      // map and all its listeners.
      $controller('UrlController', {$scope: scope});

      var syncTimeWrapper = function (newTime, oldTime) {

        if (newTime === oldTime) { return; }

        angular.forEach(scope.mapState.layerGroups, function (lg) {
          if (!scope.$$phase) {
            scope.$apply(function () {
              lg.syncTime(scope.mapState, scope.timeState, oldTime, newTime);
            });
          } else {
            lg.syncTime(scope.mapState, scope.timeState, oldTime, newTime);
          }
        });
      };

      scope.$watch('timeState.start', syncTimeWrapper);
      // TODO: check if this is the way
      scope.$watch('timeState.at', syncTimeWrapper);

      // TODO: not sure if timewrapper should be called on these changes?
      // time wrapper only updates time related stuff?
      scope.$watch('mapState.layerGroupsChanged', syncTimeWrapper);

      scope.$watch('mapState.bounds', function (newBounds, oldBounds) {

        if (newBounds === oldBounds) { return; }

        angular.forEach(scope.mapState.layerGroups, function (lg) {

          // We check whether the current lg is purely for a vector layer, else no
          // adhering-to-time needs to take place (in response to changing bounds):

          if (lg._layers.length === 1 && lg._layers[0].type === 'Vector') {
            if (!scope.$$phase) {
              scope.$apply(function () {
                lg.syncTime(scope.mapState, scope.timeState, oldBounds, newBounds);
              });
            } else {
              lg.syncTime(scope.mapState, scope.timeState, oldBounds, newBounds);
            }
          }
      });
    });
  };

  return {
    restrict: 'E',
    replace: true,
    template: '<div id="map"></div>',
    link: link
  };
}]);

/**
 * Show raster WMS images as overlay, animate overlays when animation is
 * playing.
 */
angular.module('lizard-nxt')
  .directive('rasteranimation', ['RasterService', 'UtilService',
  function (RasterService, UtilService) {
  return {
    link: function (scope, element, attrs) {

        /**
       * Get new set of images when animation stops playing
       * (resets rasterLoading to 0)
       */
      scope.$watch('timeState.animation.playing', function (n, o) {

        if (n === o) { return; }

        if (!n) {
          angular.forEach(scope.mapState.layerGroups, function(lg) {
            lg.animationStop(scope.timeState);
          });
        }
      });
    }
  };
}]);
