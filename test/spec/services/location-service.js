'use strict';

describe('Service: LocationService', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate service
  var LocationService;
  beforeEach(inject(function (_LocationService_) {
    LocationService = _LocationService_;
  }));

  it('should return a CabinetService promise ', function () {
    var result = LocationService.search('testQuery');
    expect(result.hasOwnProperty('then')).toBe(true);
  });

});
