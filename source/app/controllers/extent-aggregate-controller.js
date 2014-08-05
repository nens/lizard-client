app.controller("ExtentAggregateCtrl", [
  "$scope",
  "RasterService",
  "UtilService",
  function ($scope, RasterService, UtilService) {
    /**
     * ExtentAggregate is the object which collects different
     * sets of aggregation data. If there is no activeObject,
     * this is the default collection of data to be shown in the
     * client.
     *
     * Contains data of all active layers with an aggregation_type
     *
     */
    $scope.extentAggregate = {};

    /**
     * Loops over all layers to request aggregation data for all
     * active layers with an aggregation type.
     *
     * @param  {bounds object} bounds   mapState.bounds, containing
     *                                  leaflet bounds
     * @param  {layers object} layers   mapState.layers, containing
     *                                  nxt definition of layers
     * @param  {object} extentAggregate extentAggregate object of this
     *                                  ctrl
     */
    var updateExtentAgg = function (bounds, layers, extentAggregate) {
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
     * Puts dat on extentAggregate when promise resolves or
     * removes item from extentAggregate when no data is returned.
     *
     * @param  {promise}               a promise with aggregated data and
     *                                 the slug
     */
    var putDataOnscope = function (dataProm) {
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

    var removeDataFromScope = function (slug) {
      delete $scope.extentAggregate[slug];
    };

    /**
     * private function to eliminate redundancy: gets called
     * in multiple $watches declared locally.
     */

    var _updateExtentAgg = function () {
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

    $scope.toggleThisCard = UtilService.toggleThisCard;

    // /**
    //  * Cancels pending requests and refreshes $q type promises
    //  */
    // var extAggPromiseRefresh = function () {
    //   $scope.extentAggregate.landuse.q.resolve();
    //   $scope.extentAggregate.elevation.q.resolve();
    //   // $scope.extentAggregate.soil.q.resolve();
    //   $scope.extentAggregate.landuse.q = $q.defer();
    //   $scope.extentAggregate.elevation.q = $q.defer();
    //   // $scope.extentAggregate.soil.q = $q.defer();
    // };

    // var handleLanduseCount = function (data) {
    //   $scope.extentAggregate.landuse.data = data;
    //   $scope.extentAggregate.landuse.active = true;
    // };

    // var getLanduseCount = function (geom) {
    //   RasterService.getRasterData('landuse', geom, {
    //     agg: 'counts',
    //     q: $scope.extentAggregate.landuse.q
    //   }).then(handleLanduseCount);
    // };

    // var handleElevationCurve = function (data) {
    //   var datarow,
    //       i,
    //       formatted = [];

    //   for (i in data[0]) {
    //     datarow = [data[0][i], data[1][i]];
    //     formatted.push(datarow);
    //   }
    //   $scope.extentAggregate.elevation.data = formatted;
    // };

    // var getElevationCurve = function (geom) {
    //   RasterService.getRasterData('elevation', geom, {
    //     agg: 'curve',
    //     q: $scope.extentAggregate.elevation.q
    //   }).then(handleElevationCurve);
  }
]);
