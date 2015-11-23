'use strict';

describe('testing lizard nxt annotations', function () {

  var injector;
  var annotationsService;

  beforeEach(function () {
    module('lizard-nxt');
  });

  beforeEach(inject(function ($injector) {
    injector = $injector;
    annotationsService = $injector.get('AnnotationsService');
  }));

  it('should return a promise', function () {
    var annotations = annotationsService.getAnnotationsForObject();
    expect(annotations.hasOwnProperty('then')).toBe(true);
  });
});
