'use strict';

app.controller('RainAggregate', ["$scope", "$q", "CabinetService",
  function ($scope, $q, CabinetService) {

  $scope.$watch('mapState.here', function (n, o) {
    if (n === o) {return true; }
    $scope.rain.rainClick($scope.mapState.here);
  });

  /**
   * Clean up box when tool is turned off
   */
  $scope.$watch('tools.active', function (n, o) {
    if ($scope.tools.active !== 'rain') {
      $scope.box.type = 'empty';
      // Destroy scope at the end of this digest. Workaround from:
      // https://github.com/shinetech/angular-models/blob/master/angular-models.js
      $scope.$$postDigest(function () { $scope.$destroy(); });
    }
  });

  /**
   * Turn of tools when box.type is changed or closed
   */
  $scope.$watch('box.type', function (n, o) {
    if ($scope.box.type !== 'rain') {
      $scope.tools.active = null;
    }
  });

  // Rain model
  $scope.rain = {
    start: undefined,
    stop: undefined,
    aggWindow: undefined,
    data: undefined
  };

  /**
   * Watch to trigger call for more rain when user scrolls graph.
   */
  var holdYourFire = false;
  var firstTimeStart;
  $scope.$watch('timeState.start', function (n, o) {
    if (n === o || $scope.box.type !== 'rain') { return true; }
    if ($scope.timeState.start < $scope.rain.start - $scope.rain.aggWindow) {
      if (firstTimeStart === undefined) {
        getMoreRain(true);
        firstTimeStart = true;
      } else if ($scope.timeState.start < $scope.rain.start + 10 * $scope.rain.aggWindow
          && !holdYourFire) {
        holdYourFire = true;
        getMoreRain(true);
        setTimeout(function () {
          holdYourFire = false;
        }, 1000);
      }
    }
  });

  /**
   * Watch to trigger call for more rain when user scrolls graph.
   */
  var firstTimeEnd;
  $scope.$watch('timeState.end', function (n, o) {
    if (n === o || $scope.box.type !== 'rain') { return true; }
    if ($scope.timeState.end > $scope.rain.end + 2 * $scope.rain.aggWindow) {
      if (firstTimeEnd === undefined) {
        getMoreRain();
        firstTimeEnd = true;
      } else if ($scope.timeState.end > $scope.rain.end - 10 * $scope.rain.aggWindow
          && !holdYourFire) {
        holdYourFire = true;
        getMoreRain();
        setTimeout(function () {
          holdYourFire = false;
        }, 1000);
      }

    }
  });

  /**
   * Adds rain data to current $scope.rain.data object.
   * 
   * @param  {boolean} starty if true adds data to the front,
   *                          else to the back of the data element
   */
  var getMoreRain = function (starty) {
    var stop, start, callback;
    var buffer = 40; // Collect 40 new bars at the time
    if (starty) {
      start = $scope.rain.start - buffer * $scope.rain.aggWindow;
      stop = $scope.rain.start;
      $scope.rain.start = start;
      callback = function (response) {
        $scope.rain.data = response.result.concat($scope.rain.data);
      };
    } else {
      stop = $scope.rain.end + buffer * $scope.rain.aggWindow;
      start = $scope.rain.end;
      $scope.rain.end = stop;
      callback = function (response) {
        $scope.rain.data = $scope.rain.data.concat(response.result);
      };
    }
    getRain(
      new Date(start),
      new Date(stop),
      $scope.rain.latLng,
      callback,
      $scope.rain.aggWindow
    );
  };

  /**
   * Takes current timeState and location of click to put rain data on the $scope.
   * 
   * @param  {latlng object} e leaflet location object
   */
  $scope.rain.rainClick = function (latlng) {
    var stop = new Date($scope.timeState.end);
    var start = new Date($scope.timeState.start);
    $scope.rain.latLng = latlng;
    $scope.rain.aggWindow = 1000 * 60 * 5;
    $scope.box.type = 'rain';
    var callback = function (response) {
      $scope.rain.data = response.result;
      $scope.rain.end = $scope.rain.data[$scope.rain.data.length - 1][0];
      $scope.rain.start = $scope.rain.data[0][0];
      var interval = $scope.timeState.end - $scope.timeState.start;
      $scope.rain.nbar = 270 * $scope.rain.aggWindow / interval;
      console.log($scope.rain.nbar);
      $scope.rain.nbar = 20;
    };
    getRain(start, stop, $scope.rain.latLng, callback, $scope.rain.aggWindow);
  };

  /**
   * Gets rain from server.
   *
   * @param  {int} start    start of rainserie
   * @param  {int} stop     end of rainserie
   * @param  {function} callback function
   * @param  {object} latLng   location of rainserie in {lat: int, lng: int} (currently only supports points)
   * @param  {int} aggWindow width of the aggregation
   */
  var getRain = function (start, stop, latLng, callback, aggWindow) {
    var stopString = stop.toISOString().split('.')[0];
    var startString = start.toISOString().split('.')[0];
    var wkt = "POINT(" + latLng.lng + " " + latLng.lat + ")";
    CabinetService.raster.get({
      raster_names: 'demo:radar',
      geom: wkt,
      srs: 'EPSG:4326',
      start: startString,
      stop: stopString,
      window: aggWindow
    }).then(callback);
  };

}]);
