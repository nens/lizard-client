'use strict';

app.directive('hashGetterSetter', ["hashSyncHelper",
  function (hashSyncHelper) {

    var link = function (scope) {
      console.log("setting up hash");
      var holdRightThere = true;

      scope.$watch('mapState.activeBaselayer', function (n, o) {
        if (n === o) { return true; }
        hashSyncHelper.setHash({'bl': n}); // set baselayer in url by id
      });

      scope.$watch('mapState.moved', function (n, o) {
        holdRightThere = true;
        var COORD_PRECISION = 5;
        var newHash = [
          scope.map.getCenter().lat.toFixed(COORD_PRECISION),
          scope.map.getCenter().lng.toFixed(COORD_PRECISION),
          scope.map.getZoom()
        ].join(',');
        if (!scope.$$phase) {
          scope.$apply(function () {
            hashSyncHelper.setHash({'location': newHash});
          });
        } else {
          hashSyncHelper.setHash({'location': newHash});
        }
      });

      /**
       * Listener to update map view when user changes url
       *
       * HoldRightThere is set to true when the application updates
       * the url. Then, this listener is fired but does nothing but
       * resetting the holdRightThere back to false
       */
      scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {
        if (!holdRightThere) {
          var hash = hashSyncHelper.getHash();

          var baselayerHash = hash.bl;
          var locationHash = hash.location;

          if (baselayerHash !== undefined) {
            scope.mapState.activeBaselayer = parseInt(baselayerHash, 10);
            scope.mapState.changeBaselayer();
          }

          if (locationHash !== undefined) {
            var latlonzoom = locationHash.split(',');
            if (latlonzoom.length >= 3) { // must have 3 parameters or don't setView here...
              if (parseFloat(latlonzoom[0]) && parseFloat(latlonzoom[1]) && parseFloat(latlonzoom[2])) {
                scope.map.setView([latlonzoom[0], latlonzoom[1]], latlonzoom[2], {reset: true, animate: true});
              }
            }
          }
        }
        scope.mapState.mapMoving = false;
        holdRightThere = false;
      });
    };
    return {
      restrict: 'A',
      link: link,
    };
  }
]);