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
angular.module('omnibox')
.controller('AreaCtrl', [

  '$scope',
  'RasterService',
  'UtilService',
  '$q',
  'DataService',
  'State',

  function (

    $scope,
    RasterService,
    UtilService,
    $q,
    DataService,
    State

  ) {

    $scope.box.content = {};
    $scope.filteredRainDataPerKilometer = undefined;

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description
     * Gets data from DataService.
     * @param  {object} bounds   mapState.bounds, containing
     *                                  leaflet bounds.
     */
    var fillArea = function (bounds) {
      var promise = $scope.fillBox({
        geom: bounds,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      });
      promise.then(null, null, function (response) {
        if (response
          && response.data
          && response.data !== 'null'
          && response.layerSlug === 'rain') {
          $scope.box.content.rain.layers.rain.data
            = response.data;
          $scope.filteredRainDataPerKilometer
            = UtilService.getFilteredRainDataPerKM(
                response.data,
                State.spatial.bounds,
                State.temporal
              );
        }
      });
    };

    /**
     * Updates area when user moves map.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    /**
     * Updates area when users changes layers.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    $scope.$watch(State.toString('temporal.at'), function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    $scope.$watch(State.toString('temporal.aggWindow'),
        function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    // Load data at initialization.
    fillArea(State.spatial.bounds);

    // Make UtilSvc functions available in Angular templates
    $scope.countKeys = UtilService.countKeys;

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      DataService.reject();
      $scope.box.content = {};
    });
  }
]);

