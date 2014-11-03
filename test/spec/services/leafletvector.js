'use strict';

describe('Service: LeafletVectorService', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate service
  var LeafletVectorService;
  beforeEach(inject(function (_LeafletVectorService_) {
    LeafletVectorService = _LeafletVectorService_;
  }));

  it('should be defined', function () {
    expect(!!LeafletVectorService).toBe(true);
  });

});
