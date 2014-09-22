'use strict';

app.controller('hashGetterSetter', ['$scope', 'UrlSyncHelper', 'MapService',
  function ($scope, UrlSyncHelper, MapService) {

    var state = {
      context: {
        value: 'map', // default, future support for contextSwitch
        part: 'path',
        index: 0,
        update: true
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

    /**
     * set layer(s) when these change.
     */
    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      state.layers.update = false;
      setLayersUrl($scope.mapState.layers);
    });

    /**
     * Set location hash when map moved.
     */
    $scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      state.mapView.update = false;
      setCoordinatesUrl();
    });

    /**
     * Set start hash when timeState.start changed.
     */
    $scope.$watch('timeState.changedZoom', function (n, o) {
      if (n === o) { return true; }
      state.timeState.update = false;
      setTimeStateUrl($scope.timeState.start, $scope.timeState.end);
    });

    $scope.$watch('box.type', function (n, old) {
      if (n === old) { return true; }
      state.boxType.update = false;
      UrlSyncHelper.setUrlValue(state.boxType.part, state.boxType.index, $scope.box.type);
      if (old === 'point' || old === 'line') {
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
      setgeomUrl($scope.box.type, $scope.mapState.here);
    });

    var setgeomUrl = function (type, here) {
      var COORD_PRECISION = 4;
      var pointsStr = '';
      if (type === 'line') {
        angular.forEach($scope.mapState.points, function (point) {
          pointsStr += point.lat.toFixed(COORD_PRECISION) + ',' + point.lng.toFixed(COORD_PRECISION) + '-';
        });
      }
      pointsStr += here.lat.toFixed(COORD_PRECISION) + ',' + here.lng.toFixed(COORD_PRECISION);
      UrlSyncHelper.setUrlValue(state.geom.part, state.geom.index, pointsStr);
    };

    /**
     * Updates hash with new time.
     *
     * @param {int} time  to set in hash in ms from epoch
     * @param {boolean} start if true sets start else it sets end
     */
    var setTimeStateUrl = function (start, end) {
      var startDate = new Date(start);
      var endDate = new Date(end);
      var startDateString = startDate.toDateString()
        .slice(4) // Cut off day name
        .split(' ') // Replace spaces by hyphens
        .join(',');
      var endDateString = endDate.toDateString()
        .slice(4) // Cut off day name
        .split(' ') // Replace spaces by hyphens
        .join(',');
      UrlSyncHelper.setUrlValue(
        state.timeState.part,
        state.timeState.index,
        startDateString + '-' + endDateString);
    };

    /**
     * Sets the coordinates in the hash with a precision
     * of 4 decimals.
     */
    var setCoordinatesUrl = function () {
      var COORD_PRECISION = 4;
      var newHash = [
        MapService.mapState.center.lat.toFixed(COORD_PRECISION),
        MapService.mapState.center.lng.toFixed(COORD_PRECISION),
        MapService.mapState.zoom
      ].join(',');
      if (!$scope.$$phase) {
        $scope.$apply(function () {
          UrlSyncHelper.mapViewlValue(
            state.mapView.part,
            state.mapView.index,
            newHash);
        });
      } else {
        UrlSyncHelper.setUrlValue(
          state.mapView.part,
          state.mapView.index,
          newHash);
      }
    };

    var setLayersUrl = function (layers) {
      if (layers === undefined) { return; }
      var slugs = Object.keys(layers),
          i,
          activeSlugs = [];
      for (i = 0; i < slugs.length; i++) {
        if (layers[slugs[i]].active) {
          activeSlugs.push(slugs[i]);
        }
      }
      UrlSyncHelper.setUrlValue(
        state.layers.part,
        state.layers.index,
        activeSlugs.toString());
    };

    /**
     * Sets the timeState on scope after locationChangeSucces.
     *
     * To prevent a timeState.at that lies outside of the interval.
     * When Setting the start and end also set the at.
     *
     * @param {timeState} time  timeState with start and end.
     * @param {boolean} start   Set timeStart or timeState.end
     */
    var setTimeState = function (time, start) {
      // Make browser independent
      time = time.replace(/-/g, '/');
      var msTime = Date.parse(time);
      // bail if time is not parsable
      if (isNaN(msTime)) { return; }
      if (start) {
        $scope.timeState.start = msTime;
      } else {
        if (msTime === $scope.timeState.start) {
          msTime += 43200000; // half a day
        }
        $scope.timeState.end = msTime;
      }
      $scope.timeState.at = $scope.timeState.start +
        ($scope.timeState.end - $scope.timeState.start) / 2;
      $scope.timeState.changeOrigin = 'hash';
      $scope.timeState.changedZoom = Date.now();
    };

    var setMapView = function (mapView) {
      var latlonzoom = mapView.split(',');
      if (latlonzoom.length === 3) {
        if (parseFloat(latlonzoom[0]) &&
            parseFloat(latlonzoom[1]) &&
            parseFloat(latlonzoom[2])) {
          MapService.setView(
            [latlonzoom[0], latlonzoom[1]],
            latlonzoom[2],
            {reset: true, animate: true}
          );
        }
      }
    };

    var setBoxType = function (type) {
      $scope.box.type = type;
    };

    var setGeom = function (geom) {
      console.log(geom, $scope.box.type);
      if ($scope.box.type === 'point') {
        var point = geom.split(',');
        if (parseFloat(point[0]) &&
            parseFloat(point[1])) {
          $scope.mapState.here = L.latLng(point[0], point[1]);
        }
      } else if ($scope.box.type === 'line') {
        var points = geom.split('-');
        angular.forEach(points, function (pointStr, key) {
          var point = pointStr.split(',');
          if (parseFloat(point[0]) &&
              parseFloat(point[1])) {
            $scope.mapState.points[key] = L.latLng(point[0], point[1]);
          }
        });
      }
    };

    /**
     * Sets up the hash at creation of the controller.
     */
    var setUrlHashWhenEmpty = function () {
      if (!UrlSyncHelper.getUrlValue(state.context.part, state.context.index)) {
        UrlSyncHelper.setUrlValue(
          state.context.part,
          state.context.index,
          state.context.value);
      }
      if (!UrlSyncHelper.getUrlValue(state.boxType.part, state.boxType.index)) {
        UrlSyncHelper.setUrlValue(
          state.boxType.part,
          state.boxType.index,
          $scope.box.type);
      }
      if (!UrlSyncHelper.getUrlValue(state.layers.part, state.layers.index)) {
        setLayersUrl($scope.mapState.layers);
      }
      if (!UrlSyncHelper.getUrlValue(state.mapView.part, state.mapView.index)) {
        setCoordinatesUrl();
      }
      if (!UrlSyncHelper.getUrlValue(state.timeState.part, state.timeState.index)) {
        setTimeStateUrl($scope.timeState.start, $scope.timeState.end);
      }
    };

    setUrlHashWhenEmpty();


    var update = function () {
      var u = true;
      angular.forEach(state, function (value) {
        if (!value.update) {
          u = false;
        }
      });
      return u;
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
      if (update()) {
        var boxType = UrlSyncHelper.getUrlValue(state.boxType.part, state.boxType.index),
        geom = UrlSyncHelper.getUrlValue(state.geom.part, state.geom.index),
        layers = UrlSyncHelper.getUrlValue(state.layers.part, state.layers.index),
        mapView = UrlSyncHelper.getUrlValue(state.mapView.part, state.mapView.index),
        time = UrlSyncHelper.getUrlValue(state.timeState.part, state.timeState.index);
        if (boxType) {
          setBoxType(boxType);
        }
        if (geom) {
          setGeom(geom);
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
          setMapView(mapView);
        }
        if (time) {
          setTimeState(time);
        }

      }
      angular.forEach(state, function (value) {
        value.update = true;
      });
    });
  }
]);
