'use strict';

describe('selection service', function () {

  var SelectionService;

  beforeEach(function () {
    module('lizard-nxt');
    module('global-state');
  });

  beforeEach(inject(function ($injector) {
    SelectionService = $injector.get('SelectionService');
  }));

  it('should indicate support for the correct properties ', function () {

    expect(SelectionService.dbSupportedData).toBeDefined();
    expect(SelectionService.dbSupportedData(
        'Point', { temporal: {} })).toBe(true);
    expect(SelectionService.dbSupportedData(
        'Polygon', { scale: 'ratio' })).toBe(true);
    expect(SelectionService.dbSupportedData(
        'LineString', { format: 'Vector' })).toBe(true);
    expect(SelectionService.dbSupportedData('Point', 'ordinal')).toBe(false);
    expect(SelectionService.dbSupportedData(
        '', { scale: 'nominal' })).toBe(false);

  });

  it('should return a false match for a non existent raster', function () {

    var rasterSelection = {
      geom: "10000.0000,520000.0000",
      raster: "doesn1t0exist",
      type: "raster"
    };

    expect(SelectionService.rasterMetaDataFunction).toBeDefined();
    expect(SelectionService.rasterMetaDataFunction(undefined)).toBeDefined();
    expect(SelectionService.rasterMetaDataFunction(undefined, rasterSelection))
        .toEqual({ match: false });
  });

  it('should return a false match for a non existent timeseries', function () {

    var timeseriesSelection = {
      timeseries: "66c94920-706e-42e4-8b8c-e0c9e0e2d5db",
      type: "timeseries"
    };

    expect(SelectionService.timeseriesMetaDataFunction).toBeDefined();
    expect(SelectionService.timeseriesMetaDataFunction(undefined))
        .toBeDefined();
    expect(SelectionService.timeseriesMetaDataFunction(
        undefined, timeseriesSelection)).toEqual({ match: false });
  });


  it('should toggle active state in selections', function () {

    var selectionActive = {
      $$hashKey: "object:999",
      active: true,
      geom: "10000.0000,520000.0000",
      order: 1,
      type: "raster"
    };
    var selectionInActive = {
      $$hashKey: "object:999",
      active: false,
      order: 0,
      timeseries: "66c94920-706e-42e4-8b8c-e0c9e0e2d5db",
      type: "timeseries"
    };

    SelectionService.toggle(selectionActive);
    SelectionService.toggle(selectionInActive);

    expect(SelectionService.toggle).toBeDefined();
    expect(selectionActive.active).toBe(false);
    expect(selectionActive.order).toBe(1);
    expect(selectionInActive.active).toBe(true);
    expect(selectionInActive.order).toBe(0);
  });
});
