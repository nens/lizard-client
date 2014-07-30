app.controller("RasterAggregateCtrl", [
  "$scope",
  "$q",
  "RasterService",
  "CardService",
  function ($scope, $q, RasterService, CardService) {
    /**
     * ExtentAggregate is the object which collects different
     * sets of aggregation data. If there is no activeObject,
     * this is the default collection of data to be shown in the
     * client.
     *
     * Contains: landuse, soil and elevation data.
     *
     */

    $scope.extentAggregate = {
      changed: true,
      landuse: {
        active: CardService.getPriority('landuse'),
        data: [],
        q: $q.defer()
      },
      soil: {
        active: CardService.getPriority('soil'),
        data: [],
        types: [],
        q: $q.defer()
      },
      elevation: {
        active: CardService.getPriority('elevation'),
        data: [],
        q: $q.defer()
      }
    };

    /**
     * Cancels pending requests and refreshes $q type promises
     */
    var extAggPromiseRefresh = function () {
      $scope.extentAggregate.landuse.q.resolve();
      $scope.extentAggregate.elevation.q.resolve();
      // $scope.extentAggregate.soil.q.resolve();
      $scope.extentAggregate.landuse.q = $q.defer();
      $scope.extentAggregate.elevation.q = $q.defer();
      // $scope.extentAggregate.soil.q = $q.defer();
    };

    var handleLanduseCount = function (data) {
      $scope.extentAggregate.landuse.data = data;
      $scope.extentAggregate.landuse.active = true;
    };

    var getLanduseCount = function (geom) {
      RasterService.getRasterData('landuse', geom, {
        agg: 'counts',
        q: $scope.extentAggregate.landuse.q
      }).then(handleLanduseCount);
    };

    var handleElevationCurve = function (data) {
      var datarow,
          i,
          formatted = [];

      for (i in data[0]) {
        datarow = [data[0][i], data[1][i]];
        formatted.push(datarow);
      }
      $scope.extentAggregate.elevation.data = formatted;
    };

    var getElevationCurve = function (geom) {
      RasterService.getRasterData('elevation', geom, {
        agg: 'curve',
        q: $scope.extentAggregate.elevation.q
      }).then(handleElevationCurve);

    };

    var mapWatch = $scope.$watch('mapState.bounds', function (newVal, oldVal) {

      extAggPromiseRefresh();

      var geom = $scope.mapState.bounds;

      if ($scope.extentAggregate.landuse.active) {
        getLanduseCount(geom);
      }
      if ($scope.extentAggregate.soil.active) {
        getElevationCurve(geom);
      }
    });
  }
]);
