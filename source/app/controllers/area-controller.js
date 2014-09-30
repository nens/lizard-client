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
app.controller('AreaCtrl', [
  '$scope',
  'RasterService',
  function ($scope, RasterService) {

    var _updateExtentAgg, putDataOnscope, removeDataFromScope,
        updateExtentAgg;

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
    updateExtentAgg = function (bounds, layerGroups, area) {

      angular.forEach(layerGroups, function (layerGroup, slug) {

        if (layerGroup.isActive()
          && layerGroup._initiated
          && layerGroup._layers[0].aggregation_type !== 'none')
        {
          // Pass the promise to a function that handles the scope.
          putDataOnscope(layerGroup.getData(bounds));
        }
        else if (!layerGroup.active && slug in area)
        {
          removeDataFromScope(slug);
        }
      });
    };

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description Puts dat on area when promise resolves or
     * removes item from area when no data is returned.
     *
     * @param  {promise}               a promise with aggregated data and
     *                                 the slug
     */
    putDataOnscope = function (dataProm) {
      dataProm
      .then(function (result) {

        if (result.agg.data.length > 0) {
          $scope.area[result.slug] = result.agg;
          $scope.area[result.slug].name = $scope.mapState.layerGroups[result.slug].name;

        } else if (result.slug in $scope.area) {
          removeDataFromScope(result.slug);
        }
      });
    };

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description removes data from scope again
     * if it's no longer needed.
     * @param  {string} slug
     */
    removeDataFromScope = function (slug) {
      delete $scope.area[slug];
    };

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description Returns true/false according to whether any events are present in the
     * current lineion of spatial and temporal extent. This is used to
     * determine whether the corresponding card (i.e. the Event summary card)
     * needs to be shown.
     *
     * @return {boolean} The boolean specifying whether there are any events
     * present
     */
    $scope.eventsPresentInCurrentExtent = function () {

      if ($scope.events.types.count > 0) {

        var i, type;

        for (i in $scope.events.types) {
          type = $scope.events.types[i];
          if (type.currentCount && type.currentCount > 0) {
            return true;
          }
        }
      }

      return false;
    };

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description private function to eliminate redundancy: gets called
     * in multiple $watches declared locally.
     */
    _updateExtentAgg = function () {
      updateExtentAgg(
        $scope.mapState.bounds,
        $scope.mapState.layerGroups,
        $scope.area
      );
    };

    /**
     * Updates area when user moves map.
     */
    $scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      _updateExtentAgg();
    });

    /**
     * Updates area when users changes layers.
     */
    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      _updateExtentAgg();
    });

    // Load data at initialization.
    _updateExtentAgg();

  }
]);
