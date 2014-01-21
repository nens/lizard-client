// graph-tests.js

describe('Testing graph directives', function() {

  var $compile, $rootScope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function(_$compile_, _$rootScope_){
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  it('should have an isolate scope', function () {
    var element = angular.element('<div ng-controller="MasterCtrl">' +
      '<graph data="3"></graph></div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();
    var isolatescope = scope.$$childTail;
    expect(scope.hasOwnProperty('$$isolateBindings')).toBe(false);
    expect(isolatescope.hasOwnProperty('$$isolateBindings')).toBe(true);
  });

  it('should look at the data in the right way', function () {

  });

  it('should draw a canvas', function () {

  });

});

describe('Testing graph subdirectives', function() {

  var $compile, $rootScope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function(_$compile_, _$rootScope_){
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  it('should draw a line', function () {

  });

  it('should draw 2 lines', function () {

  });

});