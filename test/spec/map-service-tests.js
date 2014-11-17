describe('Testing map service', function () {
  var $scope, $rootScope, map;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    var NxtMap = $injector.get('NxtMap');
    var elem = document.querySelector('body').appendChild(
      document.createElement('div')
    );
    var dataLayers = window.data_layers;
    dataLayers.satellite.active = true;
    map = new NxtMap(elem, dataLayers, {});
  }));

  it('should create a map object', function () {
    console.info(map);
    expect(map._map instanceof L.Map).toBe(true);
  });

  it('should add LayerGroups', function () {
    expect(map.layerGroups.satellite.slug).toBe('satellite');
  });

  it('should toggle layerGroups', function () {
    map.toggleLayerGroup(map.layerGroups.satellite);
    expect(map.layerGroups.satellite.isActive()).toBe(true);
  });

  it('should toggle baselayerGroups on and other baselayerGroups off', function () {
    map.toggleLayerGroup(map.layerGroups.satellite);
    map.toggleLayerGroup(map.layerGroups.elevation);
    expect(map.layerGroups.elevation.isActive()).toBe(true);
    expect(map.layerGroups.satellite.isActive()).toBe(false);
  });

  it('should set layerGroups to default', function () {
    map.setLayerGoupsToDefault();
    expect(map.layerGroups.elevation.isActive()).toBe(false);
    expect(map.layerGroups.satellite.isActive()).toBe(true);
  });

});
