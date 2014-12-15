'use strict';

describe('Testing nxt data', function () {
  var $rootScope, DataService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    var NxtMap = $injector.get('NxtMap');
    var elem = document.querySelector('body').appendChild(
      document.createElement('div')
    );
    var dataLayers = $injector.get('mockDataLayers');
    dataLayers.satellite.active = true;
    var MapService = $injector.get('MapService');
    var el = angular.element('<div></div>');
    MapService.createMap(el[0], {});
    var NxtData = $injector.get('NxtData');
    DataService = new NxtData(dataLayers, 'MapService');
  }));

  it('should add LayerGroups', function () {
    expect(DataService.layerGroups.satellite.slug).toBe('satellite');
  });

  it('should toggle layerGroups', function () {
    DataService.toggleLayerGroup(DataService.layerGroups.satellite);
    expect(DataService.layerGroups.satellite.isActive()).toBe(true);
  });

  it('should toggle baselayerGroups on and other baselayerGroups off', function () {
    DataService.toggleLayerGroup(DataService.layerGroups.satellite);
    DataService.toggleLayerGroup(DataService.layerGroups.topography);
    expect(DataService.layerGroups.topography.isActive()).toBe(true);
    expect(DataService.layerGroups.satellite.isActive()).toBe(false);
  });

  it('should set layerGroups to default', function () {
    DataService.setLayerGoupsToDefault();
    expect(DataService.layerGroups.elevation.isActive()).toBe(false);
    expect(DataService.layerGroups.satellite.isActive()).toBe(true);
  });

});
