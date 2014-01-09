app.controller('SearchCtrl', function ($scope, CabinetService) {
  /**
   * Refactor and design this cruft
   */
  $scope.searchMarkers = [];
  $scope.search = function ($event) {
    if ($scope.box.query.length > 1) {
      // var search = CabinetService.termSearch.query({q: $scope.box.query}, function (data) {
      //   var sources = [];
      //   for (var i in data) {
      //     if(data[i].geometry !== null) {
      //       sources.push(data[i]);
      //     }
      //   }
        // $scope.searchMarkers.filter(function (v, i, a) { return a.indexOf (v) == i; });
        // for (var j in sources) {
        //   //console.log('sources:',sources);
        //   $scope.searchMarkers = [];
        //   if(sources[j].geometry) {
        //     $scope.searchMarkers.push(sources[j]);
        //   }
        // }

        // $scope.searchData = sources;
        // });
      
      CabinetService.geocode.query({q: $scope.box.query}, function (data) {
        $scope.box.content = data;
        });
      $scope.box.type = "location";
    }
  };

  $scope.bbox_update = function(bl_lat, bl_lon, tr_lat, tr_lon) {
    $scope.searchMarkers.filter(function (v, i, a) { return a.indexOf (v) == i; });
    var search = CabinetService.bboxSearch.query({
      bottom_left: bl_lat+','+bl_lon,
      top_right: tr_lat+','+tr_lon
    }, function (data) {
      $scope.searchMarkers = [];
      for(var i in data) {
        if(data[i].geometry) {
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

  // NOTE: find another way then $parent.$parent.../
  $scope.showDetails = function (obj) {
      $scope.currentObject = obj;
      if ($scope.currentObject.lat && $scope.currentObject.lon) {
          // A lat and lon are present, instruct the map to pan/zoom to it
          var latlng = {'lat': $scope.currentObject.lat, 'lon': $scope.currentObject.lon};
          $scope.$parent.$parent.$parent.panZoom = {
            lat: $scope.currentObject.lat,
            lng: $scope.currentObject.lon,
            zoom: 14
          };
      }
      else if ($scope.currentObject.geometry[0] && $scope.currentObject.geometry[1]) {
          $scope.$parent.$parent.$parent.panZoom = {
            lat: $scope.currentObject.geometry[1],
            lng: $scope.currentObject.geometry[0],
            zoom: 14
          };
      }
  };

  // Note: Watch is called too often
  $scope.$watch('keyIsPressed', function (newVal, oldVal) {
    if (newVal !== oldVal && $scope.keyTarget.id === "searchboxinput" && $scope.keyPressed === 13) {
      $scope.search();
    }
  });
});
