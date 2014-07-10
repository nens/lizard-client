'use strict';

app.controller('hashGetterSetter', ["$scope", "hashSyncHelper",
  function ($scope, hashSyncHelper) {

    var updateUrl = true;

    $scope.$watch('mapState.activeBaselayer', function (n, o) {
      if (n === o) { return true; }
      setBaselayerUrl();
    });

    $scope.$watch('mapState.moved', function (n, o) {
      if (n === o) { return true; }
      console.log('moved');
      updateUrl = false;
      setCoordinatesUrl();
    });

    var setCoordinatesUrl = function () {
      var COORD_PRECISION = 5;
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

    var setBaselayerUrl = function () {
      hashSyncHelper.setHash({'bl': $scope.mapState.activeBaselayer}); // set baselayer in url by id
    };

    /**
     * Listener to update map view when user changes url
     *
     * updateUrl is set to false when the application updates
     * the url. Then, this listener is fired but does nothing but
     * resetting the updateUrl back to true
     */
    $scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {
      console.log(updateUrl);
      if (updateUrl) {
        var hash = hashSyncHelper.getHash();

        var baselayerHash = hash.bl;
        var locationHash = hash.location;

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
      }
      updateUrl = true;
    });

    var hash = hashSyncHelper.getHash();

    var baselayerHash = hash.bl;
    var locationHash = hash.location;

    if (!locationHash) {
      setCoordinatesUrl();
    }
    if (!baselayerHash) {
      setBaselayerUrl();
    }
  }
]);