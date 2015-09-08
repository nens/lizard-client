'use strict';

describe('testing lizard nxt filters', function () {

  var injector;

  beforeEach(function () {
    module('lizard-nxt-filters');
  });

  beforeEach(inject(function ($injector) {
    injector = $injector;
  }));

  it('should filter value out of <number> - <source> - <value>', function () {
    var discreteRasterTypeFilter = injector.get('discreteRasterTypeFilter');
    var str = '1 - BAG - Overig / Onbekend';
    expect(discreteRasterTypeFilter(str)).toBe('Overig / Onbekend');
  });

  it('should filter value out of <source> - <value>', function () {
    var discreteRasterTypeFilter = injector.get('discreteRasterTypeFilter');
    var str = 'BAG - woonfunctie';
    expect(discreteRasterTypeFilter(str)).toBe('woonfunctie');
  });

  it('should filter value out of <value>', function () {
    var discreteRasterTypeFilter = injector.get('discreteRasterTypeFilter');
    var str = 'woonfunctie';
    expect(discreteRasterTypeFilter(str)).toBe('woonfunctie');
  });

  it('should filter source out of <number> - <source> - <value>', function () {
    var discreteRasterSourceFilter = injector.get('discreteRasterSourceFilter');
    var str = '4 - BAG - woonfunctie';
    expect(discreteRasterSourceFilter(str)).toBe('BAG');
  });

  it('should filter source out of <source> - <value>', function () {
    var discreteRasterSourceFilter = injector.get('discreteRasterSourceFilter');
    var str = 'BAG - woonfunctie';
    expect(discreteRasterSourceFilter(str)).toBe('BAG');
  });

  it('should return empty string when no source', function () {
    var discreteRasterSourceFilter = injector.get('discreteRasterSourceFilter');
    var str = 'woonfunctie';
    expect(discreteRasterSourceFilter(str)).toBe('');
  });

});
