/**
 * @ngdoc
 * @class areaCtrl
 * @memberOf app
 * @name areaCtrl
 * @description
 * area is the object which collects different
 * sets of aggregation data. If there is no activeObject,
 * this is the default collection of data to be shown in the
 * client.
 *
 * Contains data of all active layers with an aggregation_type
 *
 */
angular.module('lizard-nxt')
  .controller('AreaCtrl', [

    '$scope',
    'RasterService',
    'UtilService',
    '$q',

    function (

      $scope,
      RasterService,
      UtilService,
      $q

    ) {

    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description
     * Loops over all layergroups to get data.
     * @param  {object} bounds   mapState.bounds, containing
     *                                  leaflet bounds.
     */
    var fillArea = function (bounds) {
     //TODO draw feedback when loading data
      var promises = $scope.fillBox({
        geom: bounds,
        start: $scope.timeState.start,
        end: $scope.timeState.end,
        aggWindow: $scope.timeState.aggWindow
      });
      angular.forEach(promises, function (promise) {
        promise.then(null, null, function (response) {
          if (response.data && response.layerSlug === "dem/nl") {
            $scope.box.content[response.layerGroupSlug]
              .layers["dem/nl"]
              // Since the data is not properly formatted in the back
              // we convert it from degrees to meters here
              .data = RasterService.handleElevationCurve(response.data);
          } else if (response.data && response.layerSlug === "radar/basic") {
            $scope.box.content.rain.layers["radar/basic"].data = response.data;
            _setFilteredRainData();
          }
        });
      });
      // Draw feedback when all promises resolved
      //$q.all(promises).then(drawFeedback);
    };



    /**
     * Updates area when user moves map.
     */
    $scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      fillArea($scope.mapState.bounds);
    });

    $scope.$watch('timeState.at', function (n, o) {
      if (n === o) { return true; }
      // _setFilteredRainData();
      fillArea($scope.mapState.bounds);
    });

    $scope.$watch('timeState.aggWindow', function (n, o) {
      if (n === o) { return true; }
      // _setFilteredRainData();
      fillArea($scope.mapState.bounds);
    });

    /**
     * Updates area when users changes layers.
     */
    $scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      fillArea($scope.mapState.bounds);
    });

    // Load data at initialization.
    fillArea($scope.mapState.bounds);

    // Make UtilSvc functions available in Angular templates
    $scope.countKeys = UtilService.countKeys;

    var _resetFilteredRainData = function () {
      $scope.filteredRainData = undefined;
      $scope.filteredRainDataPerKilometer = undefined;
    };

    var _setFilteredRainData = function () {

      _resetFilteredRainData();
      data = $scope.box.content.rain.layers["radar/basic"].data;

      if (!data) {
        return;
      }

      var filteredData = [],
          current,
          currentTimestamp,
          currentVal,
          aggWindowStart = $scope.timeState.at,
          aggWindowEnd = aggWindowStart + $scope.timeState.aggWindow,
          // aggWindowStart = $scope.timeState.at + $scope.timeState.aggWindow,
          // aggWindowEnd = aggWindowStart + 2 * $scope.timeState.aggWindow,
          squareKilometers = UtilService.extent2kilometers($scope.mapState.bounds),
          DECIMAL_RESOLUTION = 100;

      // we offset the per-day aggregation with 8 hourS
      // if ($scope.timeState.aggWindow === 86400000) {
      //   console.log("PER-DAY AGG DETECTED");
      //   aggWindowStart += 28800000;
      //   aggWindowEnd += 28800000;
      // }

      console.log("current aggWindow..: " + $scope.timeState.aggWindow);
      console.log("interval start.....:" + new Date(aggWindowStart));
      console.log("interval end.......:" + new Date(aggWindowEnd));

      for (var i = 0; i < data.length; i++) {
        currentTimestamp = data[i][0];
        currentVal = data[i][1];

        if (currentTimestamp > aggWindowStart && currentTimestamp <= aggWindowEnd) {

          console.log("[+] found point within interval:" + new Date(currentTimestamp));

          $scope.filteredRainData = currentVal;
          $scope.filteredRainDataPerKilometer
            = Math.round(($scope.filteredRainData / squareKilometers) * DECIMAL_RESOLUTION) / DECIMAL_RESOLUTION;

          console.log("--> $scope.filteredRainData =", $scope.filteredRainData);
          console.log("--> $scope.filteredRainDataPerKM =", $scope.filteredRainDataPerKilometer);
          return;

        } else {
           console.log("[-] found point outside interval:" + new Date(currentTimestamp));
        }
      }

      // If a value was found for the current timeState.at/aggWindow combo,
      // this line is never reached:
      console.log("[-] No point found :(");
      _resetFilteredRainData();
    };

  }
]);
