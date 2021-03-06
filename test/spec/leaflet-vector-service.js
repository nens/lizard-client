'use strict';

describe('Service: LeafletVectorService', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate service
  var LeafletVectorService, LeafletService, geojsonmock;
  beforeEach(inject(function (_LeafletVectorService_, _LeafletService_,
        _geoJsonMock_) {
    LeafletVectorService = _LeafletVectorService_;
    LeafletService = _LeafletService_;
    geojsonmock = _geoJsonMock_;
  }));

  it('should be defined', function () {
    expect(!!LeafletVectorService).toBe(true);
  });

  it('should create a Leaflet Class instance', function () {
    var lvs = new LeafletVectorService();
    expect(lvs instanceof LeafletService.MarkerClusterGroup).toBe(true);
  });

});
