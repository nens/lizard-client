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
  .controller('AreaCtrl', ['$scope', 'RasterService', '$q', function ($scope, RasterService, $q) {

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
          if (response.data && response.layerSlug === 'ahn2/wss') {
            $scope.box.content[response.layerGroupSlug]
              .layers[response.layerSlug]
              // Since the data is not properly formatted in the back
              // we convert it from degrees to meters here
              .data = RasterService.handleElevationCurve(response.data);
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

    /**
     * Updates area when users changes layers.
     */
    $scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return true; }
      fillArea($scope.mapState.bounds);
    });

    // Load data at initialization.
    fillArea($scope.mapState.bounds);

  }
]);
