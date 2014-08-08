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
      $controller('IntersectCtrl', {
          '$scope': $scope,
          'RasterService': MockRasterService
      });
      $scope.$digest();
    };

  }));

  it('should have an empty lineIntersect', function () {
    createController();
    expect($scope.lineIntersect).toBeDefined();
    expect($scope.lineIntersect).toEqual({});
  });

});
