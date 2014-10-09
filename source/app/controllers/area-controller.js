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
app.controller('AreaCtrl', ['$scope', 'RasterService', function ($scope, RasterService) {

    $scope.area = {};

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
    var fillArea = function (bounds, layerGroups) {

      var putDataOnScope = function (response) {

        var areaLG = $scope.area[response.layerGroupSlug] || {};
        areaLG[response.layerSlug] = areaLG[response.layerSlug] || {};
        areaLG[response.layerSlug].aggType = response.aggType;
        if (response.data === null) {
          areaLG[response.layerSlug] = undefined;
        } else {
          areaLG[response.layerSlug].data = response.data;
        }
        // TODO: move formatting of data to server.
        if (response.layerSlug === 'ahn2/wss') {
          areaLG[response.layerSlug].data = RasterService.handleElevationCurve(response.data);
        }
        $scope.area[response.layerGroupSlug] = areaLG;
        console.log('area:', $scope.area);
      };

      angular.forEach(layerGroups, function (layerGroup, slug) {
        // Pass the promise to a function that handles the scope.
        layerGroup.getData({geom: bounds})
          .then(null, null, putDataOnScope);
      });
    };

    /**
     * Updates area when user moves map.
     */
    $scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      fillArea($scope.mapState.bounds, $scope.mapState.layerGroups);
    });

    /**
     * Updates area when users changes layers.
     */
    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      fillArea($scope.mapState.bounds, $scope.mapState.layerGroups);
    });

    // Load data at initialization.
    fillArea($scope.mapState.bounds, $scope.mapState.layerGroups);

  }
]);
