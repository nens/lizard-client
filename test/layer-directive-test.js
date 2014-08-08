// layer-directive-test.js

describe('Testing layer chooser directive', function() {

  var $compile, $rootScope, $httpBackend, element, scope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_, $controller) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $controller = $controller;
    element = angular.element('<div ng-controller="MasterCtrl">'
      +  '<li ng-repeat="layer in mapState.layers">'
      +  '<layer-chooser layer="layer"></layer-chooser></li>'
      + '</div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    ctrl = $controller('MapDirCtrl', {$scope: scope});
    baseLayers = [{"type": "TMS", "aggregation_type": "none", "min_zoom": 0, "min_zoom_click": null, "sublayers": [], "id": 1, "name": "Topografie", "dimensions": null, "url": "http://{s}.tiles.mapbox.com/v3/examples.map-szwdot65/{z}/{x}/{y}", "slug": "", "active": true, "order": 3, "z_index": null, "baselayer": true}, {"type": "TMS", "aggregation_type": "none", "min_zoom": 0, "min_zoom_click": null, "sublayers": [], "id": 2, "name": "Satelliet", "dimensions": null, "url": "http://khm1.googleapis.com/kh/v=137&src=app&x={x}&y={y}&z={z}&s=&token=66417", "slug": "", "active": false, "order": 2, "z_index": null, "baselayer": true}, {"type": "WMS", "aggregation_type": "none", "min_zoom": 0, "min_zoom_click": null, "sublayers": [], "id": 3, "name": "Hoogtekaart", "dimensions": null, "url": "http://raster.lizard.net/wms", "slug": "elevation", "active": false, "order": 1, "z_index": null, "baselayer": true}];
    scope.mapState = {
      layers: baseLayers
    };
    
  }));

  it('should show the text of the layer', function () {
    // invoke digest to render the directives
    scope.$digest();
    expect(element.find('span.layer-text').html()).toBe(scope.mapState.layers[0].name);
  });
});