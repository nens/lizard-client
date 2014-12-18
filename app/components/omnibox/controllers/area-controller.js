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
    'State',

    function (

      $scope,
      RasterService,
      UtilService,
      $q,
      State

    ) {

    $scope.box.content = {};
    $scope.filteredRainDataPerKilometer = undefined;

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
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      });
      angular.forEach(promises, function (promise) {
        promise.then(null, null, function (response) {
          if (response.data && response.data !== "null") {
            switch (response.layerSlug) {
            case "dem/nl":
              // Since the data is not properly formatted in the back
              // we convert it from degrees to meters here
              $scope.box.content.elevation.layers["dem/nl"].data
                = RasterService.handleElevationCurve(response.data);
              break;
            case "radar/basic":
              $scope.box.content.rain.layers["radar/basic"].data
                = response.data;
              $scope.filteredRainDataPerKilometer
                = UtilService.getFilteredRainDataPerKM(
                    response.data,
                    State.spatial.bounds,
                    State.temporal
                  );
              break;
            }
          }
        });
        // Draw feedback when all promises resolved
        //$q.all(promises).then(drawFeedback);
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

      $scope.$watch(State.toString('temporal.at'),
          function (n, o) {
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
  }
]);

