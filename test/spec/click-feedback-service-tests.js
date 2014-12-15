'use strict';

describe('Testing click feedback service', function () {
  var ClickFeedbackService, MapService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    ClickFeedbackService = $injector.get('ClickFeedbackService');
    MapService = $injector.get('MapService');
    var el = angular.element('<div></div>');
    MapService.createMap(el[0], {});
  }));

  it('should create a clicklayer', function () {
    expect(Object.keys(MapService._map._layers).length).toEqual(0);
    ClickFeedbackService.emptyClickLayer(MapService);
    expect(Object.keys(MapService._map._layers).length).toEqual(1);
  });

});
