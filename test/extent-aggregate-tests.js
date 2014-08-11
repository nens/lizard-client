describe('Testing ExtentAggregateCtrl', function () {
  var $scope,
    $rootScope,
    $controller,
    createController;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    $scope.mapState = {
      activeLayersChanged: true,
      bounds: [0],
      layers : {
        "elevation": {
          "aggregation_type": "curve",
          "name": "Hoogtekaart",
          "slug": "elevation",
          "active": false
        },
        "isahw:BOFEK2012": {
          "aggregation_type": "none",
          "name": "Bodem",
          "slug": "isahw:BOFEK2012",
          "active": false,
        },
        "landuse": {
          "aggregation_type": "counts",
          "name": "Landgebruik",
          "slug": "landuse",
          "active": false
        }
      }
    };

    var MockRasterService = {
      getAggregationForActiveLayer: function (layer, slug, agg, bounds) {
        var dataProm = {};
        dataProm.then = function (callback) {
          var result = {
            slug: layer.slug,
            agg: {
              data: [1, 2, 3, 4]
            }
          };
          callback(result);
        };
        return dataProm;
      }
    };

    createController = function() {
      $controller('ExtentAggregateCtrl', {
          '$scope': $scope,
          'RasterService': MockRasterService
      });
      $scope.$digest();
    };

  }));

  it('should have an empty extentAggregate', function () {
    createController();
    expect($scope.extentAggregate).toBeDefined();
    expect($scope.extentAggregate).toEqual({});
  });

  it('should remove data from scope when layer is inactive', function () {
    createController();
    $scope.extentAggregate = {
      landuse: {
        data: [1, 2, 3]
      }
    };

    $scope.mapState.bounds = [1];
    $scope.$digest();
    $scope.mapState.bounds = [2];
    $scope.$digest();

    expect($scope.extentAggregate.landuse).toBeUndefined();
  });

  it('should add data to scope when layer is active and has an aggregation_type', function () {
    createController();
    $scope.mapState.layers.landuse.active = true;
    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    expect($scope.extentAggregate.landuse).toBeDefined();
  });

  it('should not add data to scope when layer is active without an aggregation_type', function () {
    createController();
    $scope.mapState.layers['isahw:BOFEK2012'].active = true;
    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    expect($scope.extentAggregate['isahw:BOFEK2012']).toBeUndefined();
  });

  it('should not add data to scope when layer is inactive with an aggregation_type', function () {
    createController();
    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    expect($scope.extentAggregate.elevation).toBeUndefined();
  });

  it('should remove data from scope when layer with an aggregation_type is turned off', function () {
    createController();
    $scope.mapState.layers.landuse.active = true;
    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    $scope.mapState.layers.landuse.active = false;
    $scope.mapState.activeLayersChanged = true;
    $scope.$digest();
    expect($scope.extentAggregate.landuse).toBeUndefined();
  });

});
