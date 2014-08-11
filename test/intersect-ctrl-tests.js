describe('Testing IntersectAggregateCtrl', function () {
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
      here: {
        lat: 6,
        lng: 52
      },
      userHere: {
        lat: 5,
        lng: 51
      },
      bounds: [0],
      layers : {
        "elevation": {
          "aggregation_type": "curve",
          "name": "Hoogtekaart",
          "slug": "elevation",
          "store_path": "ahn2/wss",
          "active": false
        },
        "isahw:BOFEK2012": {
          "aggregation_type": "none",
          "name": "Bodem",
          "slug": "isahw:BOFEK2012",
          "store_path": "",
          "active": false,
        },
        "landuse": {
          "aggregation_type": "counts",
          "name": "Landgebruik",
          "slug": "landuse",
          "store_path": "use/wss",
          "active": false
        }
      }
    };

    var MockRasterService = {
      getRasterData: function (layer, slug, agg, bounds) {
        var dataProm = {};
        dataProm.then = function (callback) {
          var result = [1, 2, 3, 4];
          callback(result);
        };
        return dataProm;
      }
    };

    var MockClickFeedbackService = {
      emptyClickLayer: function () {return true; },
      drawLine: function () {return true; }
    };

    createController = function () {
      $controller('IntersectCtrl', {
          '$scope': $scope,
          'RasterService': MockRasterService,
          'ClickFeedbackService': MockClickFeedbackService
      });
      $scope.$digest();
    };

  }));

  it('should have an empty lineIntersect', function () {
    createController();
    expect($scope.lineIntersect).toBeDefined();
    expect($scope.lineIntersect).toEqual({});
  });


  it('should remove data from scope when layer is inactive', function () {
    createController();
    $scope.lineIntersect = {
      elevation: {
        data: [1, 2, 3]
      }
    };

    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    $scope.mapState.activeLayersChanged = true;
    $scope.$digest();

    expect($scope.lineIntersect.landuse).toBeUndefined();
  });

  it('should add data to scope when user clicked twice and layer is active and has an aggregation_type', function () {
    createController();
    $scope.mapState.layers.elevation.active = true;
    $scope.mapState.here = {
      lat: 6,
      lng: 52
    };
    $scope.$digest();
    $scope.mapState.here = {
      lat: 7,
      lng: 51
    };
    $scope.$digest();
    expect($scope.lineIntersect.elevation).toBeDefined();
  });

  it('should add data to scope when user clicked twice and layer is active but without an aggregation_type', function () {
    createController();
    $scope.mapState.layers.elevation.active = true;
    $scope.mapState.here = {
      lat: 6,
      lng: 52
    };
    $scope.$digest();
    $scope.mapState.here = {
      lat: 7,
      lng: 51
    };
    $scope.$digest();
    $scope.mapState.layers['isahw:BOFEK2012'].active = true;
    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    expect($scope.lineIntersect['isahw:BOFEK2012']).toBeUndefined();
  });

  it('should not add data to scope when user clicked twice and layer is inactive with an aggregation_type', function () {
    createController();
    $scope.mapState.layers.elevation.active = false;
    $scope.mapState.here = {
      lat: 6,
      lng: 52
    };
    $scope.$digest();
    $scope.mapState.here = {
      lat: 7,
      lng: 51
    };
    $scope.$digest();
    expect($scope.lineIntersect.elevation).toBeUndefined();
  });

  it('should remove data from scope when layer with an aggregation_type is turned off', function () {
    createController();
    $scope.mapState.layers.elevation.active = true;
    $scope.mapState.here = {
      lat: 6,
      lng: 52
    };
    $scope.$digest();
    $scope.mapState.here = {
      lat: 7,
      lng: 51
    };
    $scope.$digest();
    expect($scope.lineIntersect.elevation).toBeDefined();
    $scope.mapState.layers.elevation.active = false;
    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    expect($scope.lineIntersect.elevation).toBeUndefined();
  });

});
