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
    expect(layer instanceof L.Class).toBe(true);
    expect(layers.satellite.leafletLayer).toEqual(layer);
  });

  // it('should add a Layer', function () {
  //   elem = document.querySelector('body').appendChild(
  //     document.createElement('div')
  //     );
  //   var map = MapService.createMap(elem);
  //   var layer = layers.satellite

  // });

  it('should be false', function () {
    expect(true).toBe(false);
  })

});