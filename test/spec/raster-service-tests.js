// raster-service-tests.js

describe('Testing raster service', function () {
  var $scope, $rootScope, RasterService, mapState;

  mapState = {
    getActiveTemporalLayerGroup: function () {
      return {
        'slug': 'rain'
      };
    }
  };

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    RasterService = $injector.get('RasterService');
  }));

  it('should return a CabinetService get promise', function () {
    var geom = new L.LatLng(52.50995268098114, 4.961357116699219);
    var result = RasterService.getData({'layer': 'layer'}, {'geom': geom});
    expect(result.hasOwnProperty('then')).toBe(true);
  });

});
