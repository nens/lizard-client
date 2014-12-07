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
  'MapService',
  'NxtMap',
  'State',
  function ($controller, MapService, NxtMap, State) {

    var link = function (scope, element, attrs) {

      var mapSetsBounds = false;
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
        scope.mapState.mapMoving = false;
        mapSetsBounds = true;
        scope.mapState.bounds = map.getBounds();
      };

      MapService.map = new NxtMap(element[0], {
          zoomControl: false,
          addZoomTitles: true,
          zoomInTitle: scope.tooltips.zoomInMap,
          zoomOutTitle: scope.tooltips.zoomOutMap
        }
      );

      MapService.map.initiateNxtMapEvents(_clicked, _moveStarted, _moveEnded, _mouseMoved);

      /**
       * Watch bounds of state and update map bounds when state is changed.
       */
      $scope.$watch('State.spatial.bounds', function () {
        if (!mapSetsBounds) {
          MapService.map.fitBounds(State.spatial.bounds);
        } else {
          mapSetsBounds = false;
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
