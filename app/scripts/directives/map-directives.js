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
        dataLayers, {
          zoomControl: false,
          addZoomTitles: true,
          zoomInTitle: scope.tooltips.zoomInMap,
          zoomOutTitle: scope.tooltips.zoomOutMap
        }
      );

      scope.mapState.initiateNxtMapEvents(_clicked, _moveStarted, _moveEnded, _mouseMoved);

      scope.$watch('timeState', function (timeState) {
        if (timeState.animation.playing === false) {
          scope.mapState.syncTime(timeState);
        }
      });

      // Instantiate the controller that updates the hash url after creating the
      // map and all its listeners.
      $controller('UrlController', {$scope: scope});

    };

    return {
      restrict: 'E',
      replace: true,
      template: '<div id="map"></div>',
      link: link
    };
  }
]);
