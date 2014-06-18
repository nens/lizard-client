// map-tests.js

describe('Testing map directive', function () {

  var $compile,
      $rootScope,
      $httpBackend,
      $controller,
      ctrl,
      element,
      scope,
      baseLayers,
      layers,
      data_bounds;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_, $controller) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $controller = $controller;
      element = angular.element('<div ng-controller="MasterCtrl">'
      + '</div>');
      element = $compile(element)($rootScope);
      scope = element.scope();
      ctrl = $controller('MapDirCtrl', {$scope: scope});
      baseLayers = [{"type": "TMS", "aggregation_type": "none", "min_zoom": 0, "min_zoom_click": null, "sublayers": [], "id": 1, "name": "Topografie", "dimensions": null, "url": "http://{s}.tiles.mapbox.com/v3/examples.map-szwdot65/{z}/{x}/{y}", "slug": "", "active": true, "order": 3, "z_index": null, "baselayer": true}, {"type": "TMS", "aggregation_type": "none", "min_zoom": 0, "min_zoom_click": null, "sublayers": [], "id": 2, "name": "Satelliet", "dimensions": null, "url": "http://khm1.googleapis.com/kh/v=137&src=app&x={x}&y={y}&z={z}&s=&token=66417", "slug": "", "active": false, "order": 2, "z_index": null, "baselayer": true}, {"type": "WMS", "aggregation_type": "none", "min_zoom": 0, "min_zoom_click": null, "sublayers": [], "id": 3, "name": "Hoogtekaart", "dimensions": null, "url": "http://raster.lizard.net/wms", "slug": "elevation", "active": false, "order": 1, "z_index": null, "baselayer": true}];
      layers = [{"type": "ASSET", "aggregation_type": "none", "min_zoom": 12, "min_zoom_click": 0, "sublayers": [{"asset": "pumpeddrainagearea", "min_zoom": 12, "min_zoom_click": null}, {"asset": "pipe", "min_zoom": 13, "min_zoom_click": 0}], "id": 5, "name": "Afvalwater", "dimensions": null, "url": "", "slug": "sewerage", "active": true, "order": 4, "z_index": 5, "baselayer": false}];
      data_bounds = {"all": {"west": 3.04, "east": 7.58, "north": 53.63, "south": 50.57}};
    }));


  it('should iniate a tms layer', function() {
    var tmsLayer = baseLayers[0];
    expect(tmsLayer.leafletLayer).toBeUndefined();
    ctrl.initiateLayer(tmsLayer);
    expect(tmsLayer.leafletLayer).not.toBeUndefined();
  });

  it('should iniate an ASSET', function() {
    var asset = layers[0];
    expect(asset.leafletLayer).toBeUndefined();
    ctrl.initiateLayer(asset);
    expect(asset.leafletLayer).not.toBeUndefined();
  });

  it('and the asset should have an utfgrid', function() {
    var asset = layers[0];
    expect(asset.min_zoom_click).not.toBeNull();
    expect(asset.grid_layer).toBeUndefined();
    ctrl.initiateLayer(asset);
    expect(asset.grid_layer).not.toBeUndefined();
  });

  it('should create a clickLayer when clicked in space', function () {
    var asset = layers[0];
    asset.active = true;
    ctrl.initiateLayer(asset);

    scope.mapState = {};
    var mapEl = angular.element('<map></map>');
    mapEl = $compile(mapEl)(scope);

    ctrl.toggleLayer(asset);

    var e = {};
    var latLng = {lat: 52.518571202030884, lng: 4.948310852050781}
    e.latlng = latLng;
    scope.map.fireEvent('click', { e: e });
    expect(scope.mapState.hasOwnProperty('here')).toBe(true);
  });

});