'use strict';

/**
 * @ngdoc controller
 * @class UrlController
 * @memberof app
 * @name UrlController
 * @summary Sets and gets the url to the state and vice versa.
 * @description UrlController reacts to $locationChangeSucces to read
 * the url and configure lizard-nxt state accordingly. Writes state
 * changes to url. At initial load of app, url leads. Afterwards the
 * state leads the url.
 */
angular.module('lizard-nxt')
.controller('UrlController', [
  '$scope',
  '$timeout',
  'LocationGetterSetter',
  'UrlState',
  'dataBounds',
  'DataService',
  'MapService',
  'State',
  '$rootScope',
  'LeafletService',
  'gettextCatalog',
  function (
    $scope,
    $timeout,
    LocationGetterSetter,
    UrlState,
    dataBounds,
    DataService,
    MapService,
    State,
    $rootScope,
    LeafletService,
    gettextCatalog
  ) {

    // Configuration object for url state.
    var state = {
      language: {
        part: 'path',
        index: 0
      },
      context: { // Locally used name for the state
        value: 'map', // default
        part: 'path', // Part of the url where this state is stored,
        index: 1, // Position of the state in the part
      },
      layerGroups: {
        part: 'path',
        index: 2,
      },
      boxType: {
        part: 'path',
        index: 3,
      },
      geom: {
        part: 'path',
        index: 4,
      },
      mapView: {
        part: 'at',
        index: 0,
      },
      timeState: {
        part: 'at',
        index: 1,
      }
    };

   /**
    * @function
    * @memberOf app.UrlController
    * @summary Enables or disables layerGroups on the basis of the url.
    * @description Takes the layerGroups as defined in the url to turn
    *              layerGroups on afterwards it initializes all other
    *              layerGroups. This is done here so MapService does not turn
    *              on layerGroups which are turned of later by this controller.
    * @param {string} String representation of layerGroups on url
    */
    var enablelayerGroups = function (layerGroupString) {
      if (layerGroupString) {
        // Either layerGroups are on url
        State.layerGroups.active = layerGroupString.split(',');
        // Or layerGroups are not on url, turn default layerGroups on
      } else {
        DataService.setLayerGoupsToDefault();
      }
    };

   /**
    * @function
    * @memberOf app.UrlController
    * @summary Sets the mapView on the url or the url on the mapView
    * @description If mapView as string from the url is a parseable
    *              mapView, the map is set to this view. Else the map
    *              is set to bounds of data as defined by the server.
    * @param {string} String representation of mapView on url
    */
    var enableMapView = function (mapView) {
      var defaultBounds = LeafletService.latLngBounds(
        L.latLng(dataBounds.south, dataBounds.east),
        L.latLng(dataBounds.north, dataBounds.west)
      );

      if (mapView) {
        var view = UrlState.parseMapView(mapView);
        if (view) {
          State.spatial.view = {
            lat: view.latLng[0],
            lng: view.latLng[1],
            zoom: view.zoom
          };
        } else {
          State.spatial.bounds = defaultBounds;
        }
      } else {
        State.spatial.bounds = defaultBounds;
      }
    };

    /**
     * set layer(s) when these change.
     */
    $scope.$watch(State.toString('layerGroups.active'),
      function (n, o) {
        if (n === o) { return true; }
        UrlState.setlayerGroupsUrl(state, State.layerGroups.active);
      }
    );

    /**
     * Set location when map moved.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o || !State.spatial.view.lat) { return true; }
      UrlState.setCoordinatesUrl(state,
        State.spatial.view.lat,
        State.spatial.view.lng,
        State.spatial.view.zoom
      );
    });

    /**
     * Set timeState, when timeState changed. The helper serves eliminating
     * redundant code, within this file.
     */
    var setTimeStateUrlHelper = function () {
      if (!State.temporal.timelineMoving) {
        UrlState.setTimeStateUrl(
          state,
          State.temporal.start,
          State.temporal.end
        );
      }
    };

    /**
     * Set timeState, when timeState changed in response to panning/zooming the
     * timeline and in response to the user clicking the 3 timeline buttons.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      setTimeStateUrlHelper();
    });

    /*
     * Set boxType when box.type changed
     */
    $scope.$watch(State.toString('box.type'), function (n, old) {
      if (n === old) { return true; }
      LocationGetterSetter.setUrlValue(
        state.boxType.part, state.boxType.index, State.box.type
      );

      if (old === 'point' || old === 'line') {
        // Remove geometry from url
        state.boxType.update = false;
        LocationGetterSetter.setUrlValue(
          state.geom.part, state.geom.index, undefined);
      }
    });

    /*
     * Set context when context changed
     */
    $scope.$watch(State.toString('context'), function (n, old) {
      if (n === old) { return true; }
      state.context.update = false;
      LocationGetterSetter.setUrlValue(
        state.context.part, state.context.index, $scope.context
      );
    });

    /**
     * Set geom when mapState.here changed and box.type is point.
     */
    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o || State.box.type !== 'point') { return true; }
      state.geom.update = false;
      UrlState.setgeomUrl(state,
                          State.box.type,
                          State.spatial.here,
                          State.spatial.points);
    });

    /**
     * Set geom when mapState.points changed and box.type is line.
     */
    $scope.$watch(State.toString('spatial.points'), function (n, o) {
      if (n === o || State.box.type !== 'line') { return true; }
      UrlState.setgeomUrl(state,
        State.box.type,
        State.spatial.here,
        State.spatial.points
      );
    });

    /**
     * Listener to update map view when user changes url
     *
     * $locationChangeSucces is broadcasted by angular
     * when the hashSyncHelper in util-service changes the url
     */

    // $locationChangeSuccess is fired once when this controller is initialized.
    // We might move the time, so we set it to true, and the $on
    // $locationChangeSuccess sets it back to false to trigger the the rest of
    // the app to update to the time of the url.
    State.temporal.timelineMoving = true;

    var listener = $scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {
      var language = LocationGetterSetter.getUrlValue(state.language.part, state.language.index),
        boxType = LocationGetterSetter.getUrlValue(state.boxType.part, state.boxType.index),
        geom = LocationGetterSetter.getUrlValue(state.geom.part, state.geom.index),
        layerGroupsFromURL = LocationGetterSetter.getUrlValue(state.layerGroups.part, state.layerGroups.index),
        mapView = LocationGetterSetter.getUrlValue(state.mapView.part, state.mapView.index),
        time = LocationGetterSetter.getUrlValue(state.timeState.part, state.timeState.index),
        context = LocationGetterSetter.getUrlValue(state.context.part, state.context.index);

      if (language) {
        gettextCatalog.setCurrentLanguage(language);
      } else {
        // for now set default to Dutch.
        LocationGetterSetter.setUrlValue(state.language.part, state.language.index, 'nl');
      }

      if (context) {
        // Set context after digest loop because we need to enter on 'map'
        $timeout(
          function () {
            $scope.transitionToContext(context);
          },
          0, // no delay, fire when digest ends
          true // trigger new digest loop
        );
      } else {
        LocationGetterSetter.setUrlValue(state.context.part, state.context.index, state.context.value);
      }

      if (boxType) {
        State.box.type = boxType;
      } else {
        LocationGetterSetter.setUrlValue(state.boxType.part, state.boxType.index, State.box.type);
      }

      if (geom) {
        State.spatial = UrlState.parseGeom(State.box.type, geom, State.spatial);
      }

      enablelayerGroups(layerGroupsFromURL);
      enableMapView(mapView);

      if (time) {
        State.temporal = UrlState.parseTimeState(time, State.temporal);
      } else {
        state.timeState.update = false;
        UrlState.setTimeStateUrl(state, State.temporal.start, State.temporal.end);
      }

      State.temporal.timelineMoving = false;

      listener(); // remove this listener
    });

  }
]);
