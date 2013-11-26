// raster-aggregate-tests.js

describe('Testing raster requests directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope;

  beforeEach(module('lizard-nxt', 
  'ngResource',
  'graph',
  'omnibox',
  'lizard-nxt.services'));
  beforeEach(inject(function(_$compile_, _$rootScope_, _$httpBackend_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
  }));

  it('should instantiate a content type for the omnibox', function() {
    var element = angular.element('<div ng-controller="MasterCtrl"><map></map>'
        + '<raster-aggregation></raster-aggregation></div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();


    var map = scope.map;
    scope.mapBounds = map.getBounds();
    scope.box = {
        type: 'landuse',
        content: {agg: ''}
    };

    $httpBackend.when("GET", 
        "/static/data/klachten_purmerend_min.geojson").respond('');

    map.panBy(new L.Point(-0.40, 0.50));
    scope.$digest();
    scope.mapBounds = 3;
    scope.$digest();
    expect('counts').toEqual(scope.box.content.agg);
  });

  // it('should look for data based on the layername', function() {
  //   var element = angular.element('<body ng-controller="MasterCtrl"><map></map>'
  //     + '<omnibox></omnibox></body>');
  //   element = $compile(element)($rootScope);
  //   var scope = element.scope();

            

  //   scope.$digest();
  //   scope.keyPressed = 4;
  //   scope.$digest();
  //   expect(scope).toEqual(4);
  // });

  // it('should have labels', function() {
    
  // });

  // it('should have a place in the omnibox', function() {
    
  // });

  it('should request data based on viewport', function() {
    var element = angular.element('<map></map><raster-aggregation></raster-aggregation>');
    element = $compile(element)($rootScope);
    var scope = element.scope();
    var map = scope.map;
    scope.$digest();
    map.panBy(new L.Point(-0.40, 0.50));
    scope.$digest();
    expect(map.getBounds()).toEqual(scope.mapBounds);
  });

  // it('should draw data based on request', function() {

  // });


});
