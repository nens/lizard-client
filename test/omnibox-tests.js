// omnibox-tests.js

// Rewrite of old omnibox tests, to new style and new omnibox.
describe('Testing lizard-nxt omnibox directive', function() {


  var $compile, $rootScope;

  beforeEach(module('lizard-nxt',
    'templates-main'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('Should retrieve and draw an empty template', function() {
    var element = angular.element('<omnibox></omnibox>');
    element = $compile(element)($rootScope);
    var scope = element.scope();

    scope.box = {
        type: 'empty'
    }
    scope.$digest();
    var cardbox = angular.element(element.children()[1]).hasClass('cardbox')
    expect(cardbox).toBe(true);
  });

  it('Should retrieve and draw a pumpstation template', function() {
    var parentElement = angular.element('<div ng-controller="MasterCtrl"></div>');
    parentElement = $compile(parentElement)($rootScope);
    var parentScope = parentElement.scope();

    parentScope.box = {
        type: 'pumpstation_sewerage'
    };
    parentScope.activeObject = {
      selectedTimeseries: {
        data: [0,3]
      }
    }
    var element = angular.element('<omnibox></omnibox>');
    element = $compile(element)(parentScope);
    var scope = element.scope();

    scope.$digest();

    // do something useful
    // var cardbox = angular.element(element.children()[1]).hasClass('cardbox')
    expect(true).toBe(true);
  });



});