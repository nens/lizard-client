'use strict';

/**
 * Map directive
 *
 * Overview
 * ========
 *
 * Defines the map. Directive does all the watching and DOM binding.
 *
 */
angular.module('map')
  .directive('map', [
  'MapService',
  'DataService',
  'ClickFeedbackService',
  'UtilService',
  'State',
  '$timeout',
  'DashboardChartService',
  'ChartCompositionService',
  function (
    MapService,
    DataService,
    ClickFeedbackService,
    UtilService,
    State,
    $timeout,
    DashboardChartService,
    ChartCompositionService
  ) {

    var link = function (scope, element, attrs) {

      // Leaflet sometimes returns a bounds of a view, which when fitted,
      // results in a different view which when fitted, results in a different
      // bounds. This may repeat it self one to infinite times.
      //
      // The map-directive always updates the state with the leaflet map. And it
      // sets leaflet map to the state when it is not setting the state to the
      // leaflet map. When the leaflet map is updating the state it sets this
      // boolean to true. When the state changes and mapSetsViewOrBounds is
      // true, it does not sync the state with leaflet and sets
      // mapSetsViewOrBounds back to false.
      var mapSetsViewOrBounds = false;

      /**
       * Init is called when directive is compiled and listeners are attached
       * Alligns state with map.
       */
      var init = function () {

        MapService.initializeMap(element[0], {
            attributionControl: false,
            minZoom: 2,
            maxZoom: 21,
            zoomControl: false,
            addZoomTitles: true,
            worldCopyJump: true,
            lat: State.spatial.view.lat,
            lng: State.spatial.view.lng,
            zoom: State.spatial.view.zoom
          }, {
            onClick: _clicked,
            onMoveStart: _moveStarted,
            onMoveEnd: _moveEnded,
            onMouseMove: _mouseMove
          }
        );

        if (Object.keys(State.spatial.view).length !== 0) {
          mapSetsViewOrBounds = true;
          MapService.setView(State.spatial.view, {animate: true});
        }
        else if (Object.keys(State.spatial.bounds).length !== 0) {
          mapSetsViewOrBounds = true;
          MapService.fitBounds(State.spatial.bounds, {animate: true});
        }

        MapService.updateBaselayers(scope.state.baselayer);
        MapService.updateLayers(scope.state.layers);
        MapService.updateAnnotations(scope.state.annotations);

        mapSetsViewOrBounds = false;
        updateMapViewOrBounds(State.spatial.view, State.spatial.bounds);

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
        State.mouseOnLine = null;
        if (origin !== 'click') {
          MapService.line.geometry.coordinates = [];
        }
      };

      var feedbackBulb = function (mouseHover) {
        if (!State.geometries[0]) { return; }
        var coords = State.geometries[0].geometry.coordinates;
        if (coords.length === 2) {
          var point = UtilService.pointAlongLine(
            mouseHover,
            L.latLng(coords[0][1],coords[0][0]),
            L.latLng(coords[1][1], coords[1][0])
          );
          if (circleAlongLine) {
            ClickFeedbackService.updateCircle(MapService, point, circleAlongLine);
            // fugly. sorry, not sorry.
            State.mouseOnLine = L.latLng(
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
          if (coords.length === 0 && State.geometries.length !== 0) {
            // Line is the first and only geometry.
            coords = State.geometries[0].geometry.coordinates;
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
          // Do not set map bounds when state bounds change because map bounds
          // change, set boolean to true.
          mapSetsViewOrBounds = true;
          State.spatial.bounds = map.getBounds();
          State.spatial.view = MapService.getView();
        }
        $timeout(function () {
          // If map changed map view or bounds, set boolean back to false after
          // digest loop.
          mapSetsViewOrBounds = false;
        }, 0);
      };

      scope.$watch('state.layers', function (n, o) {
        MapService.updateLayers(scope.state.layers);
      }, true);

      scope.$watch('state.context', function (n) {
        // When switching back into the map ctx, we want to rebuild the TMS
        // layer for 'Water' and other assetgroups
        var assetGroups = _.filter(scope.state.layers, { type: 'assetgroup' });
        MapService.updateAssetGroups(assetGroups);

        if (n === 'map' &&
            State.box.type === 'multi-point' &&
            State.assets.length > 1)
        {
          ClickFeedbackService.initializeLabelsLayer(MapService);
        }
      }, true);

      scope.$watch('state.baselayer', function () {
        MapService.updateBaselayers();
      });

      scope.$watch('state.annotations', function () {
        MapService.updateAnnotations();
      }, true);

      /**
       * Syncs map with state if map did not sync state to map.
       *
       * @param {object} view { lat, lng, zoom }.
       * @param {object} bounds leaflet bounds.
       */
      var updateMapViewOrBounds = function (view, bounds) {
        // Do not set map bounds when state bounds change because map bounds
        // change.
        if (!mapSetsViewOrBounds) {
          var oldView = MapService.getView();

          // The spatial state can be set either by changing the bounds or by
          // changing the view. This function compares the new view to the old
          // view and prefers changing view over fitting bounds.

          if (
            view.lat === oldView.lat
            && view.lng === oldView.lng
            && view.zoom === oldView.zoom
          ) {
            MapService.fitBounds(State.spatial.bounds, {animate: true});
            State.spatial.view = MapService.getView();
          }
          else {
            MapService.setView(State.spatial.view, {animate: true});
            State.spatial.bounds = MapService.getBounds();
          }
        }
      };

      /**
       * Watch state spatial view and update the whole shebang.
       */
      scope.$watch('state.spatial.view', function (newView, oldView) {
        if (newView !== oldView) {
          updateMapViewOrBounds(newView, scope.state.spatial.bounds);
        }
      }, true);

      /**
       * Watch bounds of state and update map bounds when state is changed.
       */
      scope.$watch('state.spatial.bounds', function (newBounds, oldBounds) {
        if (newBounds !== oldBounds) {
          updateMapViewOrBounds(scope.state.spatial.view, newBounds);
          if (State.box.type === 'region') {
            MapService.getRegions(newBounds);
          }
        }
      }, true);

      /**
       * Watch temporal.at of app and update maplayers accordingly.
       *
       * Used for animation and clicks on timeline or changes from url-ctrl.
       */
      scope.$watch('state.temporal.at', function (n, o) {
        if (n === o) { return; }
        MapService.updateLayers(State.layers);
        if (State.temporal.playing) {
          MapService.updateAnnotations(State.layers);
        }
      });

      /**
       * Watch timelineMoving to update maplayers to new time domain when.
       *
       * Used for drag of timeline or changes from url-ctrl.
       */
      scope.$watch('state.temporal.timelineMoving', function (n, o) {
        if (n === o) { return; }
        MapService.updateLayers(State.layers);
        MapService.updateAnnotations(State.layers);
      });

      /**
       * Watch timelineMoving to maplayers to time domain.
       *
       * Used to turn maplayers to a none animating state. When animation stops.
       */
      scope.$watch('state.temporal.playing', function (newValue) {
        if (newValue) { return; }
        MapService.updateLayers(State.layers);
        MapService.updateAnnotations(State.layers);
      });

      scope.$watchCollection('state.geometries', function (n, o) {
        if (n === o) { return true; }
        if (State.geometries[0] === undefined) {

          if (State.box.type === 'line') { lineCleanup(); }

          // When state.geometries updates, we might need to update
          // vectorized raster layers: e.g., a selected region gets deselected
          // and then we need to update the map to show this deselection.
          // NB! This works for multiple vectorizedRasterLayers at once.

          var theRasterMapLayer,
              vectorizedRasterLayers = _.filter(State.layers,
                { type: 'raster', vectorized: true });

          _.forEach(vectorizedRasterLayers, function (layer) {
            theRasterMapLayer = _.find(MapService.mapLayers, { uuid: layer.uuid });
            theRasterMapLayer.resetActiveRegionId();
          });

          MapService.updateLayers(vectorizedRasterLayers);
        }
      });

      scope.$watch('state.box.type', function (n, o) {
        if (n === o) { return true; }

        if (n !== 'line' && o === 'line') {
          lineCleanup();
          ClickFeedbackService.emptyClickLayer(MapService);
        }

        if (n === 'multi-point') {
          ClickFeedbackService.initializeLabelsLayer(MapService);
          if (o === 'point' && State.assets && State.assets.length > 0) {
            var asset = DataService.getAssetByKey(State.assets[0])
            if (asset) {
              ClickFeedbackService.drawLabelForSingleAsset(asset);
            }
          }
        } else if (n !== 'multi-point' && o === 'multi-point') {
          ClickFeedbackService.removeLabelsLayer(MapService);
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
      scope: {
        state: '=',
      },
      template: '<div id="map" class="map"></div>',
      link: link
    };
  }
]);
