describe('Testing map service', function () {
  var $scope, $rootScope, MapService, elem;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    MapService = $injector.get('MapService');
  }));

  it('should create a map object', function () {
    elem = document.querySelector('body').appendChild(
      document.createElement('div')
      );
    var map = MapService.createMap(elem);
    expect(map instanceof L.Map).toBe(true);
  });

  it('should initiate a TMS layer ', function () {
    var layer = MapService.createLayer(layers.satellite);
    expect(layer instanceof L.TileLayer).toBe(true);
    expect(layers.satellite.leafletLayer).toEqual(layer);
  });

  it('should initiate a WMS layer ', function () {
    var layer = MapService.createLayer(layers.landuse);
    expect(layer instanceof L.TileLayer.WMS).toBe(true);
    expect(layers.landuse.leafletLayer).toEqual(layer);
  });

  it('should add a Layer', function () {
    elem = document.querySelector('body').appendChild(
      document.createElement('div')
      );
    var map = MapService.createMap(elem);
    var layer = MapService.createLayer(layers.satellite);
    MapService.addLayer(layer);
    expect(map.hasLayer(layer)).toBe(true);
  });

  it('should remove a Layer after adding', function () {
    elem = document.querySelector('body').appendChild(
      document.createElement('div')
      );
    var map = MapService.createMap(elem);
    var layer = MapService.createLayer(layers.satellite);
    MapService.addLayer(layer);
    expect(map.hasLayer(layer)).toBe(true);
    MapService.removeLayer(layer);
    expect(map.hasLayer(layer)).toBe(false);
  });

});