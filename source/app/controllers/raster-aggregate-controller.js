app.controller("RasterAggregateCtrl", ["$scope", "$q", "RasterService", 
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

  $scope.extentAggregate = {
    changed: true,
    landuse: {
      active: false,
      data: [],
      q: $q.defer()
    },
    soil: {
      active: false,
      data: [],
      types: [],
      q: $q.defer()
    },
    elevation: {
      active: false,
      data: [],
      q: $q.defer()
    }
  };


  /**
   * Cancels pending requests and refreshes $q type promises
   */
  $scope.extAggPromiseRefresh = function () {
    $scope.extentAggregate.landuse.q.resolve();
    $scope.extentAggregate.elevation.q.resolve();
    // $scope.extentAggregate.soil.q.resolve();
    $scope.extentAggregate.landuse.q = $q.defer();
    $scope.extentAggregate.elevation.q = $q.defer();
    // $scope.extentAggregate.soil.q = $q.defer();
  }

  $scope.handleLanduseCount = function (data) {
    $scope.extentAggregate.landuse.data = data;
    $scope.extentAggregate.landuse.active = true;
  };

  $scope.getLanduseCount = function (geom) {
    RasterService.getRasterData('landuse', geom, {
      agg: 'counts',
      q: $scope.extentAggregate.landuse.q
    }).then($scope.handleLanduseCount);
  };

  $scope.handleElevationCurve = function (data) {
    var datarow,
        i,
        formatted = [];
        
    for (i in data[0]) {
      datarow = [data[0][i], data[1][i]];
      formatted.push(datarow);
    }
    $scope.extentAggregate.elevation.data = formatted;
  };

  $scope.getElevationCurve = function (geom) {
    RasterService.getRasterData('elevation', geom, {
      agg: 'curve',
      q: $scope.extentAggregate.elevation.q
    }).then($scope.handleElevationCurve);

  };

  var mapWatch = $scope.$watch('mapState.bounds', function (newVal, oldVal) {    
    // if (newVal === oldVal) { return; }

    $scope.extAggPromiseRefresh();

    var geom = $scope.mapState.bounds;

    $scope.getLanduseCount(geom);   
    $scope.getElevationCurve(geom);
  });   
 
}]);