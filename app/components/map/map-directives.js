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
angular.module('map')
  .directive('map', [
  '$controller',
  'MapService',
  'DataService',
  'UtilService',
  'State',
  function ($controller, MapService, DataService, UtilService, State) {

    var link = function (scope, element, attrs) {

      var mapSetsBounds = false,
          mapSetsView = false;
       /**
        * @function
        * @memberOf app.map
        * @description small clickhandler for leafletclicks
        * @param  {event}  e Leaflet event object
        */
      var _clicked = function (e) {
        State.spatial.here = e.latlng;
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveStarted = function (e) {
        State.spatial.mapMoving = true;
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _mouseMove = function (e) {
        if (State.box.type === 'line') {
          State.spatial.userHere = e.latlng;
        }
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveEnded = function (e, map) {
        State.spatial.mapMoving = false;
        mapSetsBounds = true;
        mapSetsView = true;
        State.spatial.bounds = MapService.getBounds();
        State.spatial.view = MapService.getView();
      };

      MapService.initializeMap(element[0], {
          attributionControl: false,
          zoomControl: false,
          addZoomTitles: true,
        }, {
          onClick: _clicked,
          onMoveStart: _moveStarted,
          onMoveEnd: _moveEnded,
          onMouseMove: _mouseMove
        });

      /**
       * Watch state spatial view and update the whole shebang.
       */
      scope.$watch(State.toString('spatial.view'), function (n, o) {
        if (n !== o && !mapSetsBounds) {
          console.log('setting vie', State.spatial.view);
          MapService.setView(State.spatial.view);
          State.spatial.bounds = MapService.getBounds();
        } else {
          mapSetsView = false;
        }
      });

      /**
       * Watch bounds of state and update map bounds when state is changed.
       */
      scope.$watch(State.toString('spatial.bounds'), function (n, o) {
        if (n !== o && !mapSetsBounds) {
          console.log('setting bounds', State.spatial.bounds);
          MapService.fitBounds(State.spatial.bounds);
          State.spatial.view = MapService.getView();
        } else {
          mapSetsBounds = false;
        }
      });

      /**
       * Watch temporal.at of app and update maplayers accordingly.
       *
       * Used for animation and clicks on timeline or changes from url-ctrl.
       */
      scope.$watch(State.toString('temporal.at'), function (n, o) {
        if (n === o) { return; }
        MapService.syncTime(State.temporal);
      });

      /**
       * Watch timelineMoving to update maplayers to new time domain when.
       *
       * Used for drag of timeline or changes from url-ctrl.
       */
      scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
        if (n === o) { return; }
        MapService.syncTime(State.temporal);
      });

      /**
       * Watch timelineMoving to maplayers to time domain.
       *
       * Used to turn maplayers to a none animating state. When animation stops.
       */
      scope.$watch(function () { return State.temporal.playing; }, function (newValue) {
        if (newValue) { return; }
        MapService.syncTime(State.temporal);
      });

      scope.$watch(State.toString('box.type'), function (n, o) {
        if (n === o) { return true; }
        var selector;
        switch (n) {
          case "point":
            selector = "";
            break;
          case "line":
            selector = "#map * {cursor: crosshair;}";
            break;
          case "area":
            selector = "#map * {cursor: -webkit-grab; cursor: -moz-grab; cursor: grab; cursor: hand;}";
            break;
          default:
            return;
        }
        UtilService.addNewStyle(selector);
      });

    };

    return {
      restrict: 'E',
      replace: true,
      template: '<div id="map" class="map"></div>',
      link: link
    };
  }
]);
