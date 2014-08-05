// raster-aggregate-tests.js

describe('Testing ExtentAggregateCtrl', function () {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend, element, scope;
  
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

  beforeEach(module('lizard-nxt', function ($provide) {
    $provide.value('RasterService', MockRasterService);
  }));

  beforeEach(inject(function (_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    element = angular.element('<div ng-controller="ExtentAggregateCtrl">'
      + '</div>');
    $compile(element)($rootScope);
    scope = element.scope();

    scope.mapState = {
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

  }));

  it('should have an empty extentAggregate', function () {
    var extentAggregate = {};
    expect(scope.extentAggregate).toBeDefined();
    expect(scope.extentAggregate).toEqual(extentAggregate);
  });

  it('should remove data from scope when layer is inactive', function () {
    scope.extentAggregate = {
      landuse: {
        data: [1, 2, 3]
      }
    };

    scope.mapState.bounds = [1];
    scope.$digest();
    scope.mapState.bounds = [2];
    scope.$digest();

    expect(scope.extentAggregate.landuse).toBeUndefined();
  });

  it('should add data to scope when layer is active and has an aggregation_type', function () {
    scope.$digest();
    scope.mapState.layers.landuse.active = true;
    scope.mapState.activeLayersChanged = false;
    scope.$digest();
    expect(scope.extentAggregate.landuse).toBeDefined();
  });

  it('should not add data to scope when layer is active without an aggregation_type', function () {
    scope.$digest();
    scope.mapState.layers['isahw:BOFEK2012'].active = true;
    scope.mapState.activeLayersChanged = false;
    scope.$digest();
    expect(scope.extentAggregate['isahw:BOFEK2012']).toBeUndefined();
  });

  it('should not add data to scope when layer is inactive with an aggregation_type', function () {
    scope.$digest();
    scope.mapState.activeLayersChanged = false;
    scope.$digest();
    expect(scope.extentAggregate.elevation).toBeUndefined();
  });

  it('should remove data from scope when layer with an aggregation_type is turned off', function () {
    scope.$digest();
    scope.mapState.layers.landuse.active = true;
    scope.mapState.activeLayersChanged = false;
    scope.$digest();
    scope.mapState.layers.landuse.active = false;
    scope.mapState.activeLayersChanged = true;
    scope.$digest();
    expect(scope.extentAggregate.landuse).toBeUndefined();
  });

});
