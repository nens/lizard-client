describe('Testing LineCtrl', function () {
  var $scope,
    $rootScope,
    $controller,
    UtilService,
    createController,
    result;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    UtilService = $injector.get('UtilService');
    $scope = $rootScope.$new();

    $scope.timeState = {
      start: 1,
      end: 6,
      at: 3
    };

    var NxtMap = $injector.get('NxtMap');
    $scope.mapState = new NxtMap(angular.element('<div></div>')[0], data_layers, {
      zoomControl: false
    });

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
      $controller('LineCtrl', {
          '$scope': $scope,
          'RasterService': MockRasterService,
          'ClickFeedbackService': MockClickFeedbackService,
          'UtilService': UtilService
      });
      $scope.$digest();
    };

  }));

  it('should have an empty line', function () {
    createController();
    expect($scope.line).toBeDefined();
    expect($scope.line).toEqual({});
  });


  it('should remove data from scope when layer is inactive', function () {
    createController();
    $scope.line = {
      elevation: {
        data: [1, 2, 3]
      }
    };

    $scope.mapState.activeLayersChanged = false;
    $scope.$digest();
    $scope.mapState.activeLayersChanged = true;
    $scope.$digest();

    expect($scope.line.landuse).toBeUndefined();
  });

  it('should not add data to scope when user clicked twice and layer is inactive with an aggregation_type', function () {
    createController();
    $scope.mapState.layerGroups.elevation.active = false;
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
    expect($scope.line.elevation).toBeUndefined();
  });

});
