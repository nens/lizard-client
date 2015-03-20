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
    var result = RasterService.getData('spec', {'layer': 'layer'}, {'geom': geom});
    expect(result.hasOwnProperty('then')).toBe(true);
  });

  it('should create an image url with height and witdh of 256 when tiled', function () {
    var layer = {options: {}, url: ''}, // mock wmslayer
        store = 'test',
        el = angular.element('<div style="height: 200px; width: 300px; position: absolute;"></div>')
        map = window.L.map(angular.element('<div></div>')[0], {
          center: [1, 1],
          zoom: 13
        });
    var url = RasterService.buildURLforWMS(layer, map, store, false);
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


});
