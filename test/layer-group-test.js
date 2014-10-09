describe('Testing LayerGroup', function () {
  var LayerGroup, mockedGetData;

  beforeEach(module('lizard-nxt'));

  beforeEach(module(function ($provide) {
      $provide.value('VectorService', {
          getData: mockedGetData
        });
      $provide.value('RasterService', {
          getData: mockedGetData
        });
      $provide.value('UtfGridService', {
          getData: mockedGetData
        });
    }));

  beforeEach(inject(function ($injector) {
    var $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    mockedGetData = function () {
      var defer = $q.defer();
      defer.resolve(4);
      return defer.promise;
    };
    LayerGroup = $injector.get('LayerGroup');
  }));


  it('Has a default active equal to the active on the serverside layergroup', function () {
    var lg = new LayerGroup(data_layers.satellite);
    expect(lg.defaultActive).toBe(false);
  });

  it('Has _active on false', function () {
    var lg = new LayerGroup(data_layers.satellite);
    expect(lg._active).toEqual(false);
    expect(lg.isActive()).toEqual(false);
  });

  it('Has read-only public properties', function () {
    var lg = new LayerGroup(data_layers.satellite);
    lg.defaultActive = 'gekke gerrit';
    expect(lg.defaultActive).toEqual(false);
  });

  it('should activate layergroup when toggled', function (){
    var el = angular.element('<div id="map"></div>');
    var map = L.map(el[0]);
    var lg = new LayerGroup(data_layers.satellite);
    lg.toggle(map);
    expect(lg.isActive()).toEqual(true);
  });

  it('should initialize and add layers to map when toggled', function () {
    var el = angular.element('<div id="map"></div>');
    var map = L.map(el[0]);
    var lg = new LayerGroup(data_layers.satellite);
    lg.toggle(map);
    expect(lg._layers[0].leafletLayer instanceof L.TileLayer).toEqual(true);
    expect(map.hasLayer(lg._layers[0].leafletLayer)).toBe(true);
  });

  it('should remove layers from map when toggled again', function () {
    var el = angular.element('<div id="map"></div>');
    var map = L.map(el[0]);
    var lg = new LayerGroup(data_layers.satellite);
    lg.toggle(map);
    expect(lg._layers[0].leafletLayer instanceof L.TileLayer).toEqual(true);
    lg.toggle(map);
    expect(map.hasLayer(lg._layers[0].leafletLayer)).toBe(false);
  });

  it('should return a promise that resolves to false when layergroup is inactive', inject(function($rootScope) {
    var el = angular.element('<div id="map"></div>');
    var map = L.map(el[0]);
    var lg = new LayerGroup(data_layers.waterchain);
    lg.toggle(map); // on and initialized
    lg.toggle(map); // off
    lg.getData({geom: L.LatLng(51, 6)})
      .then(function (response) {
        expect(response).toEqual(false);
      });
    $rootScope.$digest(); // resolves promise
  }));

});
