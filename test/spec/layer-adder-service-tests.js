'use strict';
// layer-adder-service.js

describe('Testing layer adding service', function () {
  var LayerAdderService, state;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    LayerAdderService = $injector.get('LayerAdderService');
    state = $injector.get('State');
    state.layers = [
      {type: 'eventseries', uuid: 'f3r'},
      {type: 'raster', uuid: 'ae1'},
      {type: 'raster', uuid: 'bf2'}
    ];
  }));

  it('should return a zIndex 1000 + the position in the state', function () {
    var layer = {type: 'raster', uuid: 'bf2'};
    var zIndex = LayerAdderService.getZIndex(layer);
    expect(zIndex).toBe(1002);
  });

  it('should return a zIndex for eventseries higher than rasters', function () {
    var layer = {type: 'eventseries', uuid: 'f3r'};
    var zIndex = LayerAdderService.getZIndex(layer);
    expect(zIndex).toBe(100000);
  });


});
