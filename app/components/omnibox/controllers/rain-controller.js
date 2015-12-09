angular.module('omnibox')
.controller("rain", [
  'RasterService',
  'UtilService',
  'State',
  '$scope',

  function (

    RasterService,
    UtilService,
    State,
    $scope

  ) {

    // Hack to get raw rain data when hitting Export
    // Gets data directly from raster endpoint of raster RAW_RAIN_RASTER_UUID
    // limited to MAX_TIME_INTERVAL in ms
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      var RAW_RAIN_RASTER_UUID = '827dfde3-e3eb-46ee-b671-ca36e922dbb6',
          MAX_TIME_INTERVAL = 86400000 * 365.2425 / 12;  // 1 month

      if (State.temporal.end - State.temporal.start < MAX_TIME_INTERVAL) {
        $scope.rawDataUrl =
          'http://localhost:8000/api/v2/rasters/' +
          RAW_RAIN_RASTER_UUID + '/' +
          'data/?format=csv' +
          '&start=' + 
          new Date(State.temporal.start).toISOString().split('.')[0] +
          '&stop=' +
          new Date(State.temporal.end).toISOString().split('.')[0] +
          '&geom=' + UtilService.geomToWkt(State.spatial.here) +
          '&srs=EPSG:4326';
      } else {
        $scope.rawDataUrl = '.';
      }
    });

      /*
       * @description
       * angular isolate scope is messed with
       * when you using ng-if. This looks to parent
       * model and sets the local fullDetails.
       */
      $scope.$watch('box.fullDetails.rain', function (n) {
        $scope.fullDetails = n;
      });

      $scope.rrc = {
        active: false
      };

      $scope.recurrenceTimeToggle = function () {
        if (!$scope.$$phase) {
          $scope.$apply(function () {
            $scope.rrc.active = !$scope.rrc.active;
            $scope.lg.layers['rain'].changed =
             !$scope.lg.layers['rain'].changed;
          });
        } else {
          $scope.rrc.active = !$scope.rrc.active;
          $scope.lg.layers['rain'].changed = !$scope.lg.layers['rain'].changed;
        }
      };

      $scope.$watch("lg.layers['rain'].changed", function (n, o) {
        if (n === o || !$scope.rrc.active) { return; }
        getRecurrenceTime();
      });

      var getRecurrenceTime = function () {
        $scope.rrc.data = null;

        // TODO: refactor this shit
        RasterService.getData(
          'RainController',
          {slug: 'rain'},
          {
            agg: 'rrc',
            geom: State.spatial.here,
            start: State.temporal.start,
            end: State.temporal.end
          }
        ).then(function (response) {
          $scope.rrc.data = response;
        });
      };
    }
]);
