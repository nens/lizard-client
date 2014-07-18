'use strict';

app.controller('RainAggregate', ["$scope", "$q", "UtilService",
                                 "CabinetService", "RasterService",
  function ($scope, $q, UtilService, CabinetService, RasterService) {

  $scope.$watch('mapState.here', function (n, o) {
    if (n === o) {return true; }
    $scope.pointObject.rain.rainClick($scope.mapState.here);
  });

  /**
   * Clean up box when tool is turned off
   */
  $scope.$watch('tools.active', function (n, o) {
    if ($scope.tools.active !== 'rain') {
      $scope.box.type = 'empty';
      RasterService.setIntensityData([]);
      $scope.raster.changed = Date.now();
      // Destroy scope at the end of this digest. Workaround from:
      // https://github.com/shinetech/angular-models/blob/master/angular-models.js
      $scope.$$postDigest(function () { $scope.$destroy(); });
    }
  });

  /**
   * Get new raster rain data when panning or zooming spatially.
   */
  $scope.$watch('mapState.bounds', function (n, o) {
    if ($scope.timeState.hidden === false) {
      var start = $scope.timeState.start;
      var stop = $scope.timeState.end;
      var geom = $scope.mapState.bounds;
      var rain = getRainForBounds(geom, start, stop);
      rain.then(function (response) {
        RasterService.setIntensityData(response);
        $scope.raster.changed = Date.now();
      });
    }
  });

  /**
   * Get new raster rain data when panning or zooming temporally.
   */
  $scope.$watch('timeState.zoomEnded', function (n, o) {
    if ($scope.timeState.hidden === false
      && $scope.timeState.changeOrigin !== 'RainAggregate') {
      var start = $scope.timeState.start;
      var stop = $scope.timeState.end;
      var geom = $scope.mapState.bounds;
      var rain = getRainForBounds(geom, start, stop);
      rain.then(function (response) {
        RasterService.setIntensityData(response);
        $scope.raster.changed = Date.now();
      });
    }
  });

  var getRainForBounds = function (bounds, start, stop) {
    var aggWindow = UtilService.getAggWindow(start, stop, window.innerWidth);  // width of timeline
    var rain = RasterService.getRain(new Date(start), new Date(stop),
                                     bounds, aggWindow);
    return rain;
  };

  // TODO: Re implement the following when enabling scrolling in the rain graph in fullscreen.

  // /**
  //  * Watch to trigger call for more rain when user scrolls graph.
  //  */
  // var holdYourFire = false;
  // var firstTimeStart;
  // $scope.$watch('timeState.start', function (n, o) {
  //   if (n === o || $scope.box.type !== 'rain') { return true; }
  //   if ($scope.timeState.start < $scope.pointObject.rain.start - $scope.pointObject.rain.aggWindow) {
  //     if (firstTimeStart === undefined) {
  //       getMoreRain(true);
  //       firstTimeStart = true;
  //     } else if ($scope.timeState.start < $scope.pointObject.rain.start + 10 * $scope.pointObject.rain.aggWindow
  //         && !holdYourFire) {
  //       holdYourFire = true;
  //       getMoreRain(true);
  //       setTimeout(function () {
  //         holdYourFire = false;
  //       }, 1000);
  //     }
  //   }
  // });

  // /**
  //  * Watch to trigger call for more rain when user scrolls graph.
  //  */
  // var firstTimeEnd;
  // $scope.$watch('timeState.end', function (n, o) {
  //   if (n === o || $scope.box.type !== 'rain') { return true; }
  //   if ($scope.timeState.end > $scope.pointObject.rain.end + 2 * $scope.pointObject.rain.aggWindow) {
  //     if (firstTimeEnd === undefined) {
  //       getMoreRain();
  //       firstTimeEnd = true;
  //     } else if ($scope.timeState.end > $scope.pointObject.rain.end - 10 * $scope.pointObject.rain.aggWindow
  //         && !holdYourFire) {
  //       holdYourFire = true;
  //       getMoreRain();
  //       setTimeout(function () {
  //         holdYourFire = false;
  //       }, 1000);
  //     }

  //   }
  // });

  // End todo

  /**
   * Adds rain data to current $scope.pointObject.rain.data object.
   * 
   * @param  {boolean} starty if true adds data to the front,
   *                          else to the back of the data element
   */
  var getMoreRain = function (starty) {
    var stop, start, callback;
    var buffer = 40; // Collect 40 new bars at the time=
    var aggWindow = RasterService.getAggWindow($scope.timeState.start,
                                               $scope.timeState.end,
                                               272);  // graph is 272 px wide
    if (aggWindow !== $scope.pointObject.rain.aggWindow) {
      $scope.pointObject.rain.aggWindow = aggWindow;
      start = $scope.timeState.start;
      stop = $scope.timeState.end;
      callback = function (response) {
        $scope.pointObject.rain.data = response;
        $scope.pointObject.rain.end = $scope.pointObject.rain.data[$scope.pointObject.rain.data.length - 1][0];
        $scope.pointObject.rain.start = $scope.pointObject.rain.data[0][0];
      };
    } else if (starty) {
      start = $scope.pointObject.rain.start - buffer * $scope.pointObject.rain.aggWindow;
      stop = $scope.pointObject.rain.start;
      callback = function (response) {
        $scope.pointObject.rain.data = response.concat($scope.pointObject.rain.data);
        $scope.pointObject.rain.start = start;
      };
    } else {
      stop = $scope.pointObject.rain.end + buffer * $scope.pointObject.rain.aggWindow;
      start = $scope.pointObject.rain.end;
      callback = function (response) {
        $scope.pointObject.rain.data = $scope.pointObject.rain.data.concat(response);
        $scope.pointObject.rain.end = stop;
      };
    }
    RasterService.getRain(
      new Date(start),
      new Date(stop),
      $scope.pointObject.rain.latLng,
      $scope.pointObject.rain.aggWindow
    ).then(callback);
  };

}]);
