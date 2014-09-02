// graph-tests.js

describe('Testing graph directives', function () {

  var $compile, $rootScope, element, scope, dimensions;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  beforeEach(function () {
    dimensions = {width: 100, height: 90};
    stringDim = '{width: ' + String(dimensions.width) + ', height: ' + String(dimensions.height) + '}';
    element = angular.element('<div>' +
      '<graph data="[[3, 4], [2,3], [5,6]]" dimensions="'+ stringDim +'"></graph></div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    scope.$digest();
  });

  it('should have an svg', function () {
    expect(d3.select(element[0]).select('svg')[0][0]).not.toBeNull();
  });

  it('should have the correct height', function () {
    expect(d3.select(element[0]).select('svg').attr('height')).toBe(String(dimensions.height));
  });

  it('should have the correct width', function () {
    expect(d3.select(element[0]).select('svg').attr('width')).toBe(String(dimensions.width));
  });

});

describe('Testing line graph attribute directive', function() {

  var $compile, $rootScope, element, scope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  beforeEach(function () {
    element = angular.element('<div>' +
      '<graph line data="[[3, 4], [2,3], [5,6]]"></graph></div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    scope.$digest();
  });

  it('should draw a line', function () {
    expect(d3.select(element[0]).select('path')[0][0]).not.toBeNull();
  });

});

describe('Testing barChart attribute directive', function() {

  var $compile, $rootScope, element, scope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  beforeEach(function () {
    element = angular.element('<div>' +
      '<graph bar-chart data="[[1, 4], [2,3], [5,6]]"></graph></div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    scope.$digest();
  });

  it('should draw a bunch of rectangles', function () {
    expect(d3.select(element[0]).select('rect')[0][0]).not.toBeNull();
    expect(d3.select(element[0]).select('#feature-group').selectAll('rect')[0].length).toBe(3);
  });

});

describe('Testing horizontalStackChart attribute directive', function() {

  var $compile, $rootScope, element, scope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  beforeEach(function () {
    element = angular.element('<div>' +
      '<graph bar-chart data="[[1, 4], [2,3], [5,6]]"></graph></div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    scope.$digest();
  });

  it('should also draw a bunch of rectangles', function () {
    expect(d3.select(element[0]).select('rect')[0][0]).not.toBeNull();
    expect(d3.select(element[0]).select('#feature-group').selectAll('rect')[0].length).toBe(3);
  });

});