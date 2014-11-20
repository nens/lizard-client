'use strict';

describe('Service: LocationService', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate service
  var LocationService;
  beforeEach(inject(function (_LocationService_) {
    LocationService = _LocationService_;
  }));

  it('should do something', function () {
    expect(!!LocationService).toBe(true);
  });

});
