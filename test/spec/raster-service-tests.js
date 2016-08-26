// raster-service-tests.js

describe('Testing raster service', function () {
  var RasterService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    RasterService = $injector.get('RasterService');
  }));

  it('should return a CabinetService get promise', function () {
    var geom = {type: 'Point', coordinates: [52.5, 4.9]};
    var result = RasterService.getData({'layer': 'layer', 'geom': geom});
    expect(!!result.then).toBe(true);
  });

  it('should create an image url with height and witdh of 256 when tiled', function () {
    var layer = {options: {}, url: 'api/raster/sdfsdfadf'}, // mock wmslayer
        map = window.L.map(angular.element('<div></div>')[0], {
          center: [1, 1],
          zoom: 13
        });
    var url = RasterService.buildURLforWMS(layer.url, map, false);
    expect(url.split('HEIGHT=')[1].split('&')[0]).toEqual(url.split('WIDTH=')[1].split('&')[0]);
    expect(Number(url.split('HEIGHT=')[1].split('&')[0])).toBe(256);
  });

  it('should create an image url with epsg 3857 and converted BBOX', function () {
    var layer = {options: {}, url: ''}, // mock wmslayer
        store = 'test',
        el = angular.element('<div></div>')
        map = window.L.map(angular.element('<div></div>')[0], {
          center: [52, 6],
          zoom: 13
        });
    var url = RasterService.buildURLforWMS(layer, map, store, true);
    expect(url.split('SRS=')[1].split('&')[0]).toBe('EPSG%3A3857');
    expect(url.split('BBOX=')[1].split('&')[0]).toBe(
      '667925.8624129414,6800124.675105345,667925.8624129414,6800124.675105345');
  });

  it('should parse dynamic wms parameters', function () {
    var options = {
      'layers': {
        '0': {
          '0': 'radar:5min',
          '3600000': 'radar:hour',
          '86400000': 'radar:day'
        },
        '8': {
          '0': 'radar:5min',
          '86400000': 'radar:day'
        }
      },
      'styles': {
        '0': {
          '0': 'radar-5min',
          '3600000': 'radar-hour',
          '86400000': 'radar-day'
        }
      },
      'height': 497,
      'zindex': 20,
      'width': 525,
      'transparent': false
    };
    var zoom = 8;
    var aggWindow = 3600000 + 1;
    var params = RasterService.getWmsParameters(options, zoom, aggWindow);
    expect(params.styles).toBe('radar-hour');
    expect(params.layers).toBe('radar:5min');
  });

  it('should parse static wms parameters', function () {
    var options = {
      'layers': 'radar:5min',
      'styles': 'radar-5min',
      'height': 497,
      'zindex': 20,
      'width': 525,
      'transparent': false
    };
    var zoom = 8;
    var aggWindow = 3600000 + 1;
    var params = RasterService.getWmsParameters(options, zoom, aggWindow);
    expect(params.layers).toBe('radar:5min');
  });


});
