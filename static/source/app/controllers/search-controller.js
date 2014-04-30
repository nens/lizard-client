app.controller('SearchCtrl', function ($scope, CabinetService) {
  /**
   * Refactor and design this cruft
   */
  $scope.searchMarkers = [];
  $scope.search = function ($event) {
    if ($scope.box.query.length > 1) {
      CabinetService.geocode.get({q: $scope.box.query}).then(function (data) {
        $scope.box.content = data;
      });
      $scope.box.type = "location";
    }
  };

  $scope.bbox_update = function (bl_lat, bl_lon, tr_lat, tr_lon) {
    $scope.searchMarkers.filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
    var search = CabinetService.bboxSearch.query({
      bottom_left: bl_lat + ',' + bl_lon,
      top_right: tr_lat + ',' + tr_lon
    }, function (data) {
      $scope.searchMarkers = [];
      for (var i in data) {
        if (data[i].geometry) {
          $scope.searchMarkers.push(data[i]);
        }
      }
    });
  };

  $scope.reset_query = function () {
      // clean stuff..
      // Search Ctrl is the parent of omnibox cards
      // therefore no need to call $rootScope.
      $scope.$broadcast('clean');
      $scope.box.query = null;
      $scope.box.type = 'empty';
    };

  $scope.showDetails = function (obj) {
      if (obj.boundingbox) {
        southWest = new L.LatLng(obj.boundingbox[0], obj.boundingbox[2]),
        northEast = new L.LatLng(obj.boundingbox[1], obj.boundingbox[3]),
        bounds = new L.LatLngBounds(southWest, northEast);
        window.mapobj.fitBounds(bounds);
      } else {
        console.error('Oops, no boundingbox on this result - TODO: show a proper message instead of this console error...');
      }
    };

  // Note: Watch is called too often
  $scope.$watch('keyIsPressed', function (newVal, oldVal) {
    if (newVal !== oldVal && $scope.keyTarget.id === "searchboxinput"
      && $scope.keyPressed === 13) {
      $scope.search();
    }
  });
});
