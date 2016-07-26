'use strict';

describe('TimeseriesUtilService', function () {
  var TimeseriesUtilService, DataService;

  beforeEach(module('lizard-nxt'));
  beforeEach(module('timeseries'));
  beforeEach(inject(function ($injector) {
    TimeseriesUtilService = $injector.get('TimeseriesUtilService');
    DataService = $injector.get('DataService');
  }));

  it('should add thresholds to graphTimeseries of nested asset', function () {
    DataService.assets = [{
      entity_name: 'groundwaterstation',
      timeseries: [{
        uuid: 5,
        name: 'ts of parent asset',
        unit: 'm'
      }],
      selectedAsset: {
        entity_name: 'filter',
        timeseries: [{
          uuid: 4,
          name: 'ts of nested',
          unit: 'm'
        }]
      }
    }];

    var graphTs = {id: 4};

    var graphWithThreshold = TimeseriesUtilService
      .addColorAndOrderAndUnitAndTresholds(graphTs);

    expect(graphWithThreshold.thresholds).toBeDefined();
    expect(graphWithThreshold.name).toBe(
      DataService.assets[0].selectedAsset.timeseries[0].name
    );
  });

  it('should add thresholds to graphTimeseries of parent asset', function () {
    DataService.assets = [{
      entity_name: 'groundwaterstation',
      timeseries: [{
        uuid: 5,
        name: 'ts of parent asset',
        unit: 'm'
      }],
      selectedAsset: {
        entity_name: 'filter',
        timeseries: [{
          uuid: 4,
          name: 'ts of nested',
          unit: 'm'
        }]
      }
    }];

    var graphTs = {id: 5};

    var graphWithThreshold = TimeseriesUtilService
      .addColorAndOrderAndUnitAndTresholds(graphTs);

    expect(graphWithThreshold.thresholds).toBeDefined();
    expect(graphWithThreshold.name).toBe(
      DataService.assets[0].timeseries[0].name
    );
  });

});
