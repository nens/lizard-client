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

    var updateExtentAgg = function (bounds, layers, q, extentAggregate) {
      angular.forEach(layers, function (layer, slug) {
        if (layer.active && layer.aggregation_type !== 'none') {
          var agg = extentAggregate[slug] || {};
          var dataProm = RasterService.getRasterDataForExtentData(
            layer.aggregation_type,
            agg,
            slug,
            bounds)
            .then(function (data) {
              agg.data = data;
              agg.type = layer.aggregation_type;
              if (layer.aggregation_type === 'curve') {
                // TODO: return data in a better way or rewrite graph directive
                agg.data = RasterService.handleElevationCurve(data);
              }
              return {
                agg: agg,
                slug: slug
              };
            });
          // Pass the promise to a function that handles the scope.
          putDataOnscope(dataProm);
        } else if (slug in $scope.extentAggregate && !layer.active) {
          removeDataFromScope(slug);
        }
      });
    };

    var putDataOnscope = function (dataAndVisProm) {
      dataAndVisProm
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

    $scope.$watch('mapState.bounds', function (n, o) {
      if (n === o) { return true; }
      updateExtentAgg(
        $scope.mapState.bounds,
        $scope.mapState.layers,
        $q,
        $scope.extentAggregate
        );
    });

    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      updateExtentAgg(
        $scope.mapState.bounds,
        $scope.mapState.layers,
        $q,
        $scope.extentAggregate
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
