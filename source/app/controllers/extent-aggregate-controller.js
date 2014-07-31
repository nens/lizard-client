app.controller("ExtentAggregateCtrl", [
  "$scope",
  "$q",
  "RasterService",
  function ($scope, $q, RasterService) {
    /**
     * ExtentAggregate is the object which collects different
     * sets of aggregation data. If there is no activeObject,
     * this is the default collection of data to be shown in the
     * client.
     *
     * Contains: landuse, soil and elevation data.
     *
     */
    $scope.extentAggregate = {};

    var updateExtentAgg = function (bounds, layers, q) {
      angular.forEach(layers, function (layer, slug) {
        if (layer.active && layer.aggregation_type !== 'none') {
          var agg = {};
          if (agg.q) {
            agg.q.resolve();
          }
          agg.q = q.defer();
          console.log('launching:', slug, layer.aggregation_type, bounds, {
            agg: layer.aggregation_type,
            q: agg.q
          });
          RasterService.getRasterData(slug, bounds, {
            agg: layer.aggregation_type,
            q: agg.q
          }).then(function (data) {
            agg.data = data;
            switch (layer.aggregation_type) {
            case 'count':
              agg.vis = 'pie';
              break;
            case 'curve':
              agg.vis = 'line';
              break;
            }
            $scope.extentAggregate[slug] = agg;
          });
        } else if (slug in $scope.extentAggregate && !layer.active) {
          delete $scope.extentAggregate[slug];
        }
      });
    };

    $scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      updateExtentAgg(
        $scope.mapState.bounds,
        $scope.mapState.layers,
        $q
        );
    });

    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      updateExtentAgg(
        $scope.mapState.bounds,
        $scope.mapState.layers,
        $q
        );
    });

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
