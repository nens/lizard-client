'use strict';

describe('Testing map service', function () {
  var $rootScope, MapService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    var NxtMap = $injector.get('NxtMap');
    var elem = document.querySelector('body').appendChild(
      document.createElement('div')
    );
    var dataLayers = $injector.get('mockDataLayers');
    dataLayers.satellite.active = true;
    MapService = $injector.get('MapService');
    var el = angular.element('<div></div>');
    MapService.createMap(el[0], {});
  }));

  it('should create a map object', function () {
    expect(MapService._map instanceof L.Map).toBe(true);
  });

});
