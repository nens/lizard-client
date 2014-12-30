'use strict';

describe('Testing nxt data', function () {
  var $rootScope, DataService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    var MapService = $injector.get('MapService');
    var el = angular.element('<div></div>');
    MapService.initializeMap(el[0], {});
    DataService = $injector.get('DataService');
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
    expect(DataService.layerGroups.waterchain.isActive()).toBe(true);
  });

});
