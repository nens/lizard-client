describe('Testing IntersectAggregateCtrl', function () {
  var $scope,
    $rootScope,
    $controller,
    createController,
    result;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    $scope.timeState = {
      start: 1,
      end: 6,
      at: 3
    };

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
        },
        "demo:radar": {
          "aggregation_type": "none",
          "name": "Regen",
          "slug": "demo:radar",
          "store_path": "radar/basic",
          "temporal": true,
          "active": false
        }
      }
    };

    result = [[1, [2, 3, 4]], [2, [3, 4, 5]], [3, [4, 5, 6]]];
    var MockRasterService = {
      getRasterData: function (layer, slug, agg, bounds) {
        var dataProm = {};
        dataProm.then = function (callback) {
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

  it('should add data to the scope when getting data for temporal raster', function () {
    createController();
    $scope.mapState.layers['demo:radar'].active = true;
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
    expect($scope.lineIntersect['demo:radar'].result).toBeDefined();
  });

  it('should add a specific subset to the data element when getting data for temporal raster', function () {
    createController();
    $scope.mapState.layers['demo:radar'].active = true;
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
    // It converts the x-values from meters to degrees
    // and takes the second element from the list that's
    // returned by the mock (the second element corresponds
    // to the time of timeState.at relative to start and end)
    expect($scope.lineIntersect['demo:radar'].data[0][1]).toBe(result[0][1][1]);
    expect($scope.lineIntersect['demo:radar'].data[1][1]).toBe(result[1][1][1]);
    expect($scope.lineIntersect['demo:radar'].data[2][1]).toBe(result[2][1][1]);
  });

});
