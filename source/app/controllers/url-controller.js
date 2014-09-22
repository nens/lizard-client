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
app.controller('UrlController', ['$scope', 'UrlSyncHelper', 'MapService',
  'UrlState', function ($scope, UrlSyncHelper, MapService, UrlState) {

    // Configuration object for url state.
    var state = {
      context: { // Locally used name for the state
        value: 'map', // Default to accomodate future support for contextSwitch
        part: 'path', // Part of the url where this state is stored,
        index: 0, // Position of the state in the part
        update: true // When false, $locationChangeSucces is cancelled
      },
      layers: {
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

    UrlState.setUrlHashWhenEmpty(state, MapService.mapState, $scope.timeState);

    /**
     * set layer(s) when these change.
     */
    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      state.layers.update = false;
      UrlState.setLayersUrl($scope.mapState.layers);
    });

    /**
     * Set location when map moved.
     */
    $scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      state.mapView.update = false;
      UrlState.setCoordinatesUrl(MapService.mapState.center.lat,
        MapService.mapState.center.lng,
        MapService.mapState.zoom);
    });

    /**
     * Set timeState when timeState changed.
     */
    $scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      state.timeState.update = false;
      UrlState.setTimeStateUrl($scope.timeState.start, $scope.timeState.end);
    });

    /*
     * Set boxType when box.type changed
     */
    $scope.$watch('box.type', function (n, old) {
      if (n === old) { return true; }
      state.boxType.update = false;
      UrlSyncHelper.setUrlValue(state.boxType.part, state.boxType.index, $scope.box.type);
      if (old === 'point' || old === 'line') {
        // Remove geometry from url
        state.boxType.update = false;
        UrlSyncHelper.setUrlValue(state.geom.part, state.geom.index, undefined);
      }
    });

    /**
     * Set geom when mapState.here changed.
     */
    $scope.$watch('mapState.here', function (n, o) {
      if (n === o) { return true; }
      state.geom.update = false;
      UrlState.setgeomUrl($scope.box.type, $scope.mapState.here);
    });

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
      if (UrlState.update()) {
        var boxType = UrlSyncHelper.getUrlValue(state.boxType.part, state.boxType.index),
        geom = UrlSyncHelper.getUrlValue(state.geom.part, state.geom.index),
        layers = UrlSyncHelper.getUrlValue(state.layers.part, state.layers.index),
        mapView = UrlSyncHelper.getUrlValue(state.mapView.part, state.mapView.index),
        time = UrlSyncHelper.getUrlValue(state.timeState.part, state.timeState.index);
        if (boxType) {
          if (geom) { // Setting the box to anything but default requires geometry on url.
            $scope.box.type = boxType;
          }
        }
        if (geom) {
          $scope.mapState = UrlState.setGeom(geom, $scope.box.type, MapService.mapState);
        }

        if (layers) {
          var activeSlugs = layers.split(','),
              allSlugs = Object.keys($scope.mapState.layers),
              i,
              active;

          for (i = 0; i < allSlugs.length; i++) {
            // check if hash contains layers otherwise set to inactive;
            active = (activeSlugs.indexOf(allSlugs[i]) >= 0);
            if ((active && !$scope.mapState.layers[allSlugs[i]].active)
              || (!active && $scope.mapState.layers[allSlugs[i]].active)) {
              $scope.mapState.changeLayer($scope.mapState.layers[allSlugs[i]]);
              MapService.mapState.activeLayersChanged = Date.now();
            }
          }
        }
        if ($scope.mapState.layersNeedLoading) {
          // Initialise layers
          angular.forEach(MapService.mapState.layers, function (layer) {
            MapService.mapState.activeLayersChanged = Date.now();
            if (!layer.initiated) {
              MapService.createLayer(layer);
            }

            if (layer.active && layer.initiated) {
              layer.active = false;
              MapService.toggleLayer(layer, MapService.mapState.layers);
            }
          });
          $scope.mapState.layersNeedLoading = false;
        }

        if (mapView) {
          var view = UrlState.setMapView(mapView);
          if (view) {
            MapService.setView(view.latLng, view.zoom, view.options);
          }
        }
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
