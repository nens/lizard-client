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
    MapService.createLayer(layers.satellite);
    expect(layers.satellite.leafletLayer instanceof L.TileLayer).toBe(true);
  });

  it('should initiate a WMS layer ', function () {
    MapService.createLayer(layers.landuse);
    expect(layers.landuse.leafletLayer instanceof L.TileLayer.WMS).toBe(true);
  });

  it('should initiate an Asset layer ', function () {
    MapService.createLayer(layers.waterchain);
    expect(layers.waterchain.grid_layer instanceof L.UtfGrid).toBe(true);
    expect(layers.waterchain.leafletLayer instanceof L.TileLayer).toBe(true);
  });

  it('should add a Layer', function () {
    elem = document.querySelector('body').appendChild(
      document.createElement('div')
      );
    var map = MapService.createMap(elem);
    MapService.createLayer(layers.satellite);
    MapService.addLayer(layers.satellite.leafletLayer);
    expect(map.hasLayer(layers.satellite.leafletLayer)).toBe(true);
  });

  it('should remove a Layer after adding', function () {
    elem = document.querySelector('body').appendChild(
      document.createElement('div')
      );
    var map = MapService.createMap(elem);
    MapService.createLayer(layers.satellite);
    MapService.addLayer(layers.satellite.leafletLayer);
    expect(map.hasLayer(layers.satellite.leafletLayer)).toBe(true);
    MapService.removeLayer(layers.satellite.leafletLayer);
    expect(map.hasLayer(layers.satellite.leafletLayer)).toBe(false);
  });

  it('should initiate and catch click events', function () {
    elem = document.querySelector('body').appendChild(
      document.createElement('div')
      );
    var bounds = window.data_bounds.all;
    var map = MapService.createMap(elem, {
      bounds: bounds
    });
    MapService.initiateMapEvents();
    oldHere = MapService.mapState.here;
    var location = new L.LatLng(52.5052,4.9604);
    map.fireEvent('click', {
      latlng: location,
      layerPoint: map.latLngToLayerPoint(location),
      containerPoint: map.latLngToContainerPoint(location)
    });
    expect(oldHere).toBe(null);
    expect(MapService.mapState.here.lat).toBe(location.lat);
  });

});