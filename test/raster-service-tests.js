// raster-service-tests.js

describe('Testing raster service', function () {
  var $scope, $rootScope, RasterService;

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

});