'use strict';

app.controller('RainAggregate', ["$scope", "$q", "UtilService",
                                 "CabinetService", "RasterService",
  function ($scope, $q, UtilService, CabinetService, RasterService) {

  $scope.$watch('mapState.here', function (n, o) {
    if (n === o) {return true; }
    $scope.activeObject.rain.rainClick($scope.mapState.here);
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

  // Rain model
  $scope.activeObject.rain = {
    start: undefined,
    stop: undefined,
    aggWindow: RasterService.rainInfo.timeResolution,
    data: undefined
  };

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
  //   if ($scope.timeState.start < $scope.activeObject.rain.start - $scope.activeObject.rain.aggWindow) {
  //     if (firstTimeStart === undefined) {
  //       getMoreRain(true);
  //       firstTimeStart = true;
  //     } else if ($scope.timeState.start < $scope.activeObject.rain.start + 10 * $scope.activeObject.rain.aggWindow
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
  //   if ($scope.timeState.end > $scope.activeObject.rain.end + 2 * $scope.activeObject.rain.aggWindow) {
  //     if (firstTimeEnd === undefined) {
  //       getMoreRain();
  //       firstTimeEnd = true;
  //     } else if ($scope.timeState.end > $scope.activeObject.rain.end - 10 * $scope.activeObject.rain.aggWindow
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
   * Adds rain data to current $scope.activeObject.rain.data object.
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
    if (aggWindow !== $scope.activeObject.rain.aggWindow) {
      $scope.activeObject.rain.aggWindow = aggWindow;
      start = $scope.timeState.start;
      stop = $scope.timeState.end;
      callback = function (response) {
        $scope.activeObject.rain.data = response;
        $scope.activeObject.rain.end = $scope.activeObject.rain.data[$scope.activeObject.rain.data.length - 1][0];
        $scope.activeObject.rain.start = $scope.activeObject.rain.data[0][0];
      };
    } else if (starty) {
      start = $scope.activeObject.rain.start - buffer * $scope.activeObject.rain.aggWindow;
      stop = $scope.activeObject.rain.start;
      callback = function (response) {
        $scope.activeObject.rain.data = response.concat($scope.activeObject.rain.data);
        $scope.activeObject.rain.start = start;
      };
    } else {
      stop = $scope.activeObject.rain.end + buffer * $scope.activeObject.rain.aggWindow;
      start = $scope.activeObject.rain.end;
      callback = function (response) {
        $scope.activeObject.rain.data = $scope.activeObject.rain.data.concat(response);
        $scope.activeObject.rain.end = stop;
      };
    }
    RasterService.getRain(
      new Date(start),
      new Date(stop),
      $scope.activeObject.rain.latLng,
      $scope.activeObject.rain.aggWindow
    ).then(callback);
  };

  /**
   * Takes current timeState and location of click to put rain data on the $scope.
   * 
   * @param  {latlng object} e leaflet location object
   */
  $scope.activeObject.rain.rainClick = function (latlng) {
    var stop = new Date($scope.timeState.end);
    var start = new Date($scope.timeState.start);
    $scope.activeObject.rain.latLng = latlng;
    $scope.activeObject.rain.aggWindow = UtilService.getAggWindow($scope.timeState.start,
                                                     $scope.timeState.end,
                                                     272);  // graph is 272 px wide
    RasterService.getRain(start, stop, $scope.activeObject.rain.latLng, $scope.activeObject.rain.aggWindow)
      .then(function (response) {
        $scope.activeObject.rain.data = response;
        $scope.activeObject.rain.end = $scope.activeObject.rain.data[$scope.activeObject.rain.data.length - 1][0];
        $scope.activeObject.rain.start = $scope.activeObject.rain.data[0][0];
      }
    ).then(function () {
      // TODO: this is now an extra call to get rain recurrence time
      // refactor to one call
      RasterService.getRain(start, stop, $scope.activeObject.rain.latLng,
                            $scope.activeObject.rain.aggWindow, 'rrc')
        .then(function (response) {
          $scope.activeObject.rain.recurrenceTime = response;
        }
      );
    });
  };

}]);
