/**
 * @ngdoc
 * @class ExtentAggregateCtrl
 * @memberOf app
 * @name ExtentAggregateCtrl
 * @description 
 * ExtentAggregate is the object which collects different
 * sets of aggregation data. If there is no activeObject,
 * this is the default collection of data to be shown in the
 * client.
 *
 * Contains data of all active layers with an aggregation_type
 *
 */
app.controller('ExtentAggregateCtrl', [
  '$scope',
  'RasterService',
  function ($scope, RasterService) {
    var _updateExtentAgg, putDataOnscope, removeDataFromScope,
        updateExtentAgg;

    $scope.extentAggregate = {};

    /**
     * @function
     * @memberOf app.ExtentAggregateCtrl
     * @description
     * Loops over all layers to request aggregation data for all
     * active layers with an aggregation type.
     *
     * @param  {object} bounds   mapState.bounds, containing
     *                                  leaflet bounds
     * @param  {object} layers   mapState.layers, containing
     *                                  nxt definition of layers
     * @param  {object} extentAggregate extentAggregate object of this
     *                                  ctrl
     */
    updateExtentAgg = function (bounds, layers, extentAggregate) {
      angular.forEach(layers, function (layer, slug) {
        if (layer.active && layer.aggregation_type !== 'none') {
          var agg = extentAggregate[slug] || {};
          var dataProm = RasterService.getAggregationForActiveLayer(layer, slug, agg, bounds);
          // Pass the promise to a function that handles the scope.
          putDataOnscope(dataProm);
        } else if (slug in extentAggregate && !layer.active) {
          removeDataFromScope(slug);
        }
      });
    };

    /**
     * @function
     * @memberOf app.ExtentAggregateCtrl
     * @description Puts dat on extentAggregate when promise resolves or
     * removes item from extentAggregate when no data is returned.
     *
     * @param  {promise}               a promise with aggregated data and
     *                                 the slug
     */
    putDataOnscope = function (dataProm) {
      dataProm
      .then(function (result) {
        if (result.agg.data.length > 0) {
          $scope.extentAggregate[result.slug] = result.agg;
          $scope.extentAggregate[result.slug].name = $scope.mapState.layers[result.slug].name;
        } else if (result.slug in $scope.extentAggregate) {
          removeDataFromScope(result.slug);
        }
      });
    };

    /**
     * @function
     * @memberOf app.ExtentAggregateCtrl
     * @description removes data from scope again
     * if it's no longer needed.
     * @param  {string} slug 
     */
    removeDataFromScope = function (slug) {
      delete $scope.extentAggregate[slug];
    };

    /**
     * @function
     * @memberOf app.ExtentAggregateCtrl
     * @description Returns true/false according to whether any events are present in the
     * current intersection of spatial and temporal extent. This is used to
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
     * @memberOf app.ExtentAggregateCtrl
     * @description private function to eliminate redundancy: gets called
     * in multiple $watches declared locally.
     */
    _updateExtentAgg = function () {
      updateExtentAgg(
        $scope.mapState.bounds,
        $scope.mapState.layers,
        $scope.extentAggregate
      );
    };

    /**
     * Updates extentaggregate when user moves map.
     */
    $scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      _updateExtentAgg();
    });

    /**
     * Updates extentaggregate when users changes layers.
     */
    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      _updateExtentAgg();
    });

    // Load data at initialization.
    _updateExtentAgg();

  }
]);
