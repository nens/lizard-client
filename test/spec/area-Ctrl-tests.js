describe('Testing AreaCtrl', function () {
  var $scope,
    $rootScope,
    $controller,
    NxtMap,
    createController;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    NxtMap = $injector.get('NxtMap');
    $scope.mapState = new NxtMap(angular.element('<div></div>')[0], data_layers, {
      zoomControl: false
    });

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
      $controller('AreaCtrl', {
          '$scope': $scope,
          'RasterService': MockRasterService
      });
      $scope.$digest();
    };

  }));

  it('should have an empty area', function () {
    createController();
    expect($scope.area).toBeDefined();
    expect($scope.area).toEqual({});
  });

});
