'use strict';
// resource-service-tests.js

describe('Testing resource service', function () {
  var resourceService;

 beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    resourceService = $injector.get('Resource');
  }));

  it('should have baseUrl', function () {
    expect(resourceService.baseUrl).toBe('');
  });

  describe('setBaseUrl', function () {
    it('should change the baseUrl', function () {
      var exampleUrl = 'http://example.com';
      resourceService.setBaseUrl(exampleUrl);
      expect(resourceService.baseUrl).toBe(exampleUrl);
    });
  });

  describe('setDefaultHttpFields', function () {
    it('should set options', function () {
      //test empty
      expect(resourceService.options).toEqual({});

      var credentialOptions = {withCredentials: true};

      resourceService.setDefaultHttpFields(credentialOptions);
      expect(resourceService.options).toEqual(credentialOptions);
    });
  });

  describe('buildOptions', function () {
    it('should make a valid options dict', function () {
      var options = resourceService.buildOptions('api/v2/dummy/',
          {q: 'testqparam'}, 'PATCH');
      expect('url' in options).toBe(true);
      expect('params' in options).toBe(true);
      expect('method' in options).toBe(true);
      expect(options.method).toBe('PATCH');
    });
  });

  describe('Endpoint', function () {
    it('should return an instance of Endpoint with a get method', function () {
      var endpoint = new resourceService.Endpoint();
      expect('get' in endpoint).toBe(true);
    });

    it('should return a promise when running get', function () {
      var endpoint = new resourceService.Endpoint();
      var promise = endpoint.get();
      expect(!!promise.then).toBe(true);
    });

    it('should setBaseUrl of endpoint without overriding resources', function () {
      var endpoint = new resourceService.Endpoint();
      resourceService.setBaseUrl('http://example.com');

      endpoint.setBaseUrl('http://another-example.com');
      expect(resourceService.baseUrl).toBe('http://example.com');
      expect(endpoint.baseUrl).toBe('http://another-example.com');
    });
  });
});
