// layer-directive-test.js

describe('Testing layer chooser directive', function () {

  var $compile, $rootScope, $httpBackend, NxtMap, element, scope, LeafletService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_, $controller, $injector) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $controller = $controller;

    element = angular.element('<div ng-controller="MasterCtrl">'
      +  '<li ng-repeat="layergroup in mapState.layerGroups | orderObjectBy: \'order\': false">'
      +      '<layer-chooser layergroup="layergroup"></layer-chooser>'
      +      '</li>'
      + '</div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    NxtMap = $injector.get('NxtMap');
    scope.mapState = new NxtMap(angular.element('<div></div>')[0], data_layers, {
      zoomControl: false
    });
    LeafletService = $injector.get('LeafletService');
  }));

  it('should show the text of the layer', function () {
    // invoke digest to render the directives
    scope.$digest();
    expect(element.find('span.layer-text').html()).toBe('Hoogtekaart');
  });
});
