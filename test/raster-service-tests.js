// raster-service-tests.js

describe('Testing raster service', function () {
  var $scope, $rootScope, RasterService, mapState;

  mapState = {
    getActiveTemporalLayer: function () {
      return {
        'slug': 'demo:radar'
      };
    }
  };

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    RasterService = $injector.get('RasterService');
  }));

  it('should get Raster information', function () {
    var rasterStuff = RasterService.rasterInfo('demo:radar');
    expect(rasterStuff.timeResolution).toBe(300000);
  });

  it('should return the given value on set/getIntensityData', function () {
    var thisun = 'intensityData';
    RasterService.setIntensityData(thisun);
    expect(RasterService.getIntensityData()).toEqual(thisun);
  });

  it('should return a CabinetService get promise', function () {
    var start = new Date("Sat Jan 11 2014 00:00:00 GMT+0100 (CET)"),
        stop  = new Date("Sun Jan 19 2014 00:00:00 GMT+0100 (CET)"),
        geom  = new L.LatLng(52.50995268098114, 4.961357116699219),
        aggWindow = 86400000,
        rasterNames = "demo:radar";
    var result = RasterService.getTemporalRaster(start, stop, geom, aggWindow, rasterNames);
    expect(result.hasOwnProperty('then')).toBe(true);
  });

  it('should make mustShowRainCard() return false when raster data contains only null values', function () {

    var pointObject, result;

    pointObject = {
      temporalRaster: {
        type: 'demo:radar',
        data: [[1000, null], [1001, null], [1002, null]]
      }
    };

    result = RasterService.mustShowRainCard(mapState, pointObject);
    expect(result).toBe(false);
  });

  it('should make mustShowRainCard() return true when raster data contains one or more non-null values', function () {

    var pointObject, result;

    pointObject = {
      temporalRaster: {
        type: 'demo:radar',
        data: [[1000, null], [1001, null], [1002, 0.000000000000000001]]
      }
    };

    result = RasterService.mustShowRainCard(mapState, pointObject);
    expect(result).toBe(true);
  });
});