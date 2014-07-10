'use strict';

app.controller('hashGetterSetter', ["$scope", "hashSyncHelper",
  function ($scope, hashSyncHelper) {

    // Only set url when user changed it or on pageload
    var updateUrl = true;

    /**
     * Set baselayer hash when activeBaselayer changed.
     */
    $scope.$watch('mapState.activeBaselayer', function (n, o) {
      if (n === o) { return true; }
      setBaselayerUrl($scope.mapState.activeBaselayer);
    });

    /**
     * Set location hash when map moved.
     */
    $scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      updateUrl = false;
      setCoordinatesUrl();
    });

    /**
     * Set start hash when timeState.start changed.
     */
    $scope.$watch('timeState.start', function (n, o) {
      if (n === o) { return true; }
      updateUrl = false;
      setTimeStateUrl($scope.timeState.start, true);
    });

    /**
     * Set end hash when timeState.end changed.
     */
    $scope.$watch('timeState.end', function (n, o) {
      if (n === o) { return true; }
      updateUrl = false;
      setTimeStateUrl($scope.timeState.end, false);
    });

    var setTimeStateUrl = function (time, start) {
      var date = new Date(time);
      var dateString = date.toDateString().split(' ').join('-');
      if (start) {
        hashSyncHelper.setHash({'start': dateString});
      } else {
        hashSyncHelper.setHash({'end': dateString});
      }
    };

    var setCoordinatesUrl = function () {
      var COORD_PRECISION = 4;
      var newHash = [
        $scope.map.getCenter().lat.toFixed(COORD_PRECISION),
        $scope.map.getCenter().lng.toFixed(COORD_PRECISION),
        $scope.map.getZoom()
      ].join(',');
      if (!$scope.$$phase) {
        $scope.$apply(function () {
          hashSyncHelper.setHash({'location': newHash});
        });
      } else {
        hashSyncHelper.setHash({'location': newHash});
      }
    };

    var setBaselayerUrl = function (baselayerId) {
      hashSyncHelper.setHash({'baselayer': baselayerId}); // set baselayer in url by id
    };

    (function setUrlHashWhenEmpty() {
      var hash = hashSyncHelper.getHash();

      var baselayerHash = hash.baselayer;
      var locationHash = hash.location;

      if (!locationHash) {
        setCoordinatesUrl();
      }
      if (!baselayerHash) {
        setBaselayerUrl($scope.mapState.activeBaselayer);
      }
    })();

    /**
     * Listener to update map view when user changes url
     *
     * updateUrl is set to false when the application updates
     * the url. Then, this listener is fired but does nothing but
     * resetting the updateUrl back to true
     */
    $scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {
      if (updateUrl) {
        var hash = hashSyncHelper.getHash();

        var baselayerHash = hash.baselayer;
        var locationHash = hash.location;
        var startHash = hash.start;
        var endHash = hash.end;

        if (baselayerHash !== undefined) {
          $scope.mapState.activeBaselayer = parseInt(baselayerHash, 10);
          $scope.mapState.changeBaselayer();
        }

        if (locationHash !== undefined) {
          var latlonzoom = locationHash.split(',');
          if (latlonzoom.length >= 3) { // must have 3 parameters or don't setView here...
            if (parseFloat(latlonzoom[0]) && parseFloat(latlonzoom[1]) && parseFloat(latlonzoom[2])) {
              $scope.map.setView([latlonzoom[0], latlonzoom[1]], latlonzoom[2], {reset: true, animate: true});
            }
          }
        }

        if (startHash !== undefined) {
          $scope.timeState.start = Date.parse(startHash);
        }

        if (endHash !== undefined) {
          $scope.timeState.end = Date.parse(endHash);
        }
      }
      updateUrl = true;
    });

  }
]);