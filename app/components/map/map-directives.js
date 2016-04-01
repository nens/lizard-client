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
  'MapService',
  'DataService',
  'ClickFeedbackService',
  'UtilService',
  'State',
  function (
    MapService,
    DataService,
    ClickFeedbackService,
    UtilService,
    State
  ) {

    var link = function (scope, element, attrs) {

      var mapSetsBounds = false,
          mapSetsView = false;

      /**
       * Init is called when directive is compiled and listeners are attached
       * Alligns state with map.
       */
      var init = function () {
        if (Object.keys(State.spatial.view).length !== 0) {
          mapSetsView = true;
          MapService.setView(State.spatial.view);
        }
        else if (Object.keys(State.spatial.bounds).length !== 0) {
          mapSetsBounds = true;
          MapService.fitBounds(State.spatial.bounds);
        }
      };

       /**
        * @function
        * @memberOf app.map
        * @description small clickhandler for leafletclicks
        * @param  {event}  e Leaflet event object
        */
      var _clicked = function (e) {
        if (State.box.type === 'point'
          || State.box.type === 'multi-point'
          || State.box.type === 'line') {
          MapService.spatialSelect(e.latlng);
        }
        if (State.box.type === 'line'
          && MapService.line.geometry.coordinates.length === 2) {
          ClickFeedbackService.emptyClickLayer(MapService);
          lineCleanup('click');
        }
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveStarted = function (e) {
        State.spatial.mapMoving = true;
      };

      var circleAlongLine;
      var lineCleanup = function (origin) {
        if (circleAlongLine) {
          ClickFeedbackService.removeLeafletLayerWithId(MapService, circleAlongLine);
          circleAlongLine = undefined;
        }
        State.selected.mouseOnLine = null;
        if (origin !== 'click') {
          MapService.line.geometry.coordinates = [];
        }
      }

      var feedbackBulb = function (mouseHover) {
        if (!State.selected.geometries[0]) { return; }
        var coords = State.selected.geometries[0].geometry.coordinates;
        if (coords.length === 2) {
          var point = UtilService.pointAlongLine(
            mouseHover,
            L.latLng(coords[0][1],coords[0][0]),
            L.latLng(coords[1][1], coords[1][0])
          );
          if (circleAlongLine) {
            ClickFeedbackService.updateCircle(MapService, point, circleAlongLine);
            // fugly. sorry, not sorry.
            State.selected.mouseOnLine = L.latLng(
              coords[0][1],
              coords[0][0])
            .distanceTo(point);

          } else {
            circleAlongLine = ClickFeedbackService.drawCircle(MapService, point, true, 15);
          }
        }
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _mouseMove = function (e) {
        if (State.box.type === 'line') {
          var coords = MapService.line.geometry.coordinates;
          if (coords.length === 0 && State.selected.geometries.length !== 0) {
            // Line is the first and only geometry.
            coords = State.selected.geometries[0].geometry.coordinates;
          }

          var start = (coords.length > 0) ? L.latLng(coords[0][1], coords[0][0]) : null;
          var end = e.latlng;

          if (coords.length === 1) {
            ClickFeedbackService.emptyClickLayer(MapService);
            ClickFeedbackService.drawLine(
              MapService,
              start,
              end
            );
          }
          feedbackBulb(e.latlng);
        } else {
          lineCleanup();
        }
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveEnded = function (e, map) {
        State.spatial.mapMoving = false;
        // Moveended is fired on teardown of map and map.getBounds() returns a
        // bounds object of size zero. We want to keep the bounds.
        if (State.context === 'map') {
          mapSetsBounds = true;
          mapSetsView = true;
          State.spatial.bounds = map.getBounds();
          State.spatial.view = MapService.getView();
        }
      };

      MapService.initializeMap(element[0], {
          attributionControl: false,
          minZoom: 2,
          zoomControl: false,
          addZoomTitles: true,
        }, {
          onClick: _clicked,
          onMoveStart: _moveStarted,
          onMoveEnd: _moveEnded,
          onMouseMove: _mouseMove
        }
      );

      /**
       * Watch state spatial view and update the whole shebang.
       */
      scope.$watch(State.toString('spatial.view'), function (n, o) {
        if (n !== o && !mapSetsBounds) {
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
          MapService.fitBounds(State.spatial.bounds);
          State.spatial.view = MapService.getView();
        } else {
          mapSetsBounds = false;
        }
        if (State.box.type === 'area') {
          var b = State.spatial.bounds;
          State.selected.geometries = [];
          State.selected.geometries.addGeometry(L.rectangle(b).toGeoJSON());
        }
        else if (State.box.type === 'region') {
          MapService.getRegions(State.spatial.bounds);
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

      scope.$watch(State.toString('selected.geometries'), function (n, o) {
        if (n === o) { return true; }
        if (State.box.type === 'line' && State.selected.geometries[0] === undefined) {
          lineCleanup();
        }
      });

      scope.$watch(State.toString('box.type'), function (n, o) {
        if (n === o) { return true; }

        if (n !== 'line' && o === 'line') {
          lineCleanup();
          ClickFeedbackService.emptyClickLayer(MapService);
        }

        var selector;
        switch (n) {
        case "point":
          selector = "";
          MapService.removeRegions();
          break;
        case "multi-point":
          selector = "";
          MapService.removeRegions();
          break;
        case "line":
          selector = "#map * {cursor: crosshair;}";
          MapService.removeRegions();
          break;
        case "region":
          selector = "";
          MapService.getRegions(State.spatial.bounds);
          break;
        case "area":
          selector = "#map * {cursor: -webkit-grab; cursor: -moz-grab; cursor: grab; cursor: hand;}";
          MapService.removeRegions();
          State.selected.geometries = [];
          var b = State.spatial.bounds;
          State.selected.geometries.addGeometry(L.rectangle(b).toGeoJSON());
          break;
        default:
          return;
        }
        UtilService.addNewStyle(selector);


      });

      init();

      // Remove all references to current map.
      element.on('$destroy', function () {
        MapService.remove();
        ClickFeedbackService.remove();
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
