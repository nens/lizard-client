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
app.controller('UrlController', ['$scope', 'LocationGetterSetter', 'MapService',
  'UrlState', 'CabinetService',
  function ($scope, LocationGetterSetter, MapService, UrlState, CabinetService) {

    // Configuration object for url state.
    var state = {
      context: { // Locally used name for the state
        value: 'map', // Default to accomodate future support for contextSwitch
        part: 'path', // Part of the url where this state is stored,
        index: 0, // Position of the state in the part
        update: true // When false, $locationChangeSucces is cancelled
      },
      layerGroups: {
        part: 'path',
        index: 1,
        update: true
      },
      boxType: {
        part: 'path',
        index: 2,
        update: true
      },
      geom: {
        part: 'path',
        index: 3,
        update: true
      },
      mapView: {
        part: 'at',
        index: 0,
        update: true
      },
      timeState: {
        part: 'at',
        index: 1,
        update: true
      }
    };

    UrlState.setUrlHashWhenEmpty(state, $scope.box.type, $scope.mapState, $scope.timeState);

    /**
     * set layer(s) when these change.
     */
    $scope.$watch('mapState.activelayerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      state.layerGroups.update = false;
      UrlState.setlayerGroupsUrl(state, $scope.mapState.layerGroups);
    });

    /**
     * Set location when map moved.
     */
    $scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      state.mapView.update = false;
      UrlState.setCoordinatesUrl(state,
        $scope.mapState.center.lat,
        $scope.mapState.center.lng,
        $scope.mapState.zoom);
    });

    /**
     * Set timeState when timeState changed.
     */
    $scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      state.timeState.update = false;
      UrlState.setTimeStateUrl(state, $scope.timeState.start, $scope.timeState.end);
    });

    /*
     * Set boxType when box.type changed
     */
    $scope.$watch('box.type', function (n, old) {
      if (n === old) { return true; }
      state.boxType.update = false;
      LocationGetterSetter.setUrlValue(state.boxType.part, state.boxType.index, $scope.box.type);
      if (old === 'point' || old === 'line') {
        // Remove geometry from url
        state.boxType.update = false;
        LocationGetterSetter.setUrlValue(state.geom.part, state.geom.index, undefined);
      }
    });

    /**
     * Set geom when mapState.here changed and box.type is point.
     */
    $scope.$watch('mapState.here', function (n, o) {
      if (n === o || $scope.box.type !== 'point') { return true; }
      state.geom.update = false;
      UrlState.setgeomUrl(state, $scope.box.type, $scope.mapState.here, $scope.mapState.points);
    });

    /**
     * Set geom when mapState.points changed and box.type is line.
     */
    $scope.$watch('mapState.points', function (n, o) {
      if (n === o || $scope.box.type !== 'line') { return true; }
      state.geom.update = false;
      UrlState.setgeomUrl(state, $scope.box.type, $scope.mapState.here, $scope.mapState.points);
    }, true);

   /**
    * @function
    * @memberOf app.UrlController
    * @summary Enables or disables layerGroups on the basis of the url.
    * @description Takes the layerGroups as defined in the url to turn layerGroups on
    *              afterwards it initializes all other layerGroups. This is done
    *              here so MapService does not turn on layerGroups which are
    *              turned of later by this controller.
    * @param {string} String representation of layerGroups on url
    */
    var enablelayerGroups = function (layerGroupString) {
      console.log(layerGroupString);
      if (layerGroupString) {
        // Either layerGroups are on url
        var activeLayerSlugs = layerGroupString.split(',');

        angular.forEach(activeLayerSlugs, function (layergroup) {
          if (layergroup.slug in activeLayerSlugs && !layergroup.isActive()) {
            MapService.toggleLayerGroup(layergroup);
          }
        });
        // Or layerGroups are not on url, turn default layerGroups on
      } else {
        MapService.setLayerGoupsToDefault();
      }
    };

    var enableMapView = function (mapView) {
      var fn = function () {
        MapService.fitBounds(CabinetService.dataBounds.all);
      };

      if (mapView) {
        var view = UrlState.parseMapView(mapView);
        if (view) {
          MapService.setView(view.latLng, view.zoom, view.options);
        } else fn();
      } else fn();
    };



    /**
     * Listener to update map view when user changes url
     *
     * $locationChangeSucces is broadcasted by angular
     * when the hashSyncHelper in util-service changes the url
     *
     * updateUrl is set to false when the application updates
     * the url. Then, this listener is fired but does nothing but
     * resetting the updateUrl back to true
     */
    $scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {

      console.log('$locationChangeSuccess');
      if (UrlState.update(state)) {
        var boxType = LocationGetterSetter.getUrlValue(state.boxType.part, state.boxType.index),
          geom = LocationGetterSetter.getUrlValue(state.geom.part, state.geom.index),
          layerGroupsFromURL = LocationGetterSetter.getUrlValue(state.layerGroups.part, state.layerGroups.index),
          mapView = LocationGetterSetter.getUrlValue(state.mapView.part, state.mapView.index),
          time = LocationGetterSetter.getUrlValue(state.timeState.part, state.timeState.index);
        if (boxType) {
          if (geom) { // Setting the box to anything but default requires geometry on url.
            $scope.box.type = boxType;
          } else {
            LocationGetterSetter.setUrlValue(state.boxType.part, state.boxType.index, $scope.box.type);
          }
        }
        if (geom) {
          $scope.mapState = UrlState.parseGeom($scope.box.type, geom, $scope.mapState);
        }

        enablelayerGroups(layerGroupsFromURL);
        enableMapView(mapView);

        if (time) {
          $scope.timeState = UrlState.parseTimeState(time, $scope.timeState);
        }

      }
      angular.forEach(state, function (value) {
        value.update = true;
      });
    });
  }
]);
