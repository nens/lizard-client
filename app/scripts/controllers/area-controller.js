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
app.controller('AreaCtrl', ['$scope', 'RasterService', '$q', function ($scope, RasterService, $q) {

    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description
     * Loops over all layers to request aggregation data for all
     * active layers with an aggregation type.
     *
     * @param  {object} bounds   mapState.bounds, containing
     *                                  leaflet bounds
     * @param  {object} layers   mapState.layers, containing
     *                                  nxt definition of layers
     * @param  {object} area area object of this
     *                                  ctrl
     */
    var fillArea = function (bounds) {
      //TODO draw feedback when loading data
      var promises = $scope.fillBox(bounds);
      angular.forEach(promises, function (promise) {
        promise.then(null, null, function (response) {
          console.log(response);
          if (response.data && response.layerSlug === 'ahn2/wss') {
            $scope.box.content[response.layerGroupSlug]
              .layers[response.layerSlug]
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
