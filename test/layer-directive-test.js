// layer-directive-test.js

describe('Testing layer chooser directive', function() {

  var $compile, $rootScope, $httpBackend, element, scope, LeafletService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_, $controller, $injector) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $controller = $controller;
    element = angular.element('<div ng-controller="MasterCtrl">'
      +  '<li ng-repeat="layer in mapState.layers">'
      +  '<layer-chooser layer="layer"></layer-chooser></li>'
      + '</div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    LeafletService = $injector.get('LeafletService');

    scope.mapState = {
      layers: window.layers,
      zoom: 10,
      bounds: LeafletService.bounds(
        LeafletService.point(
          window.data_bounds.all.south, window.data_bounds.all.east),
        LeafletService.point(
          window.data_bounds.all.north, window.data_bounds.all.west))
    };
  }));

  it('should show the text of the layer', function () {
    // invoke digest to render the directives
    scope.$digest();
    expect(element.find('span.layer-text').html()).toBe('Alarmen');
  });
});