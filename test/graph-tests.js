// graph-tests.js
describe('Testing graph directives', function () {

  var $compile, $rootScope, element, scope, dimensions;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  beforeEach(function () {
    dimensions = {
      width: 100,
      height: 90,
      padding: {
        top: 1,
        left: 2,
        right: 3,
        bottom: 4
      }
    };
    var stringDim = '{width: ' + String(dimensions.width) + ', height: ' + String(dimensions.height)
    + ', padding: ' + '{top: ' + String(dimensions.padding.top) + ', left: ' + String(dimensions.padding.left)
    + ', right: ' + String(dimensions.padding.right) + ', bottom: ' + String(dimensions.padding.bottom) + '}}';
    element = angular.element('<div>' +
      '<graph data="[[3, 4], [2,3], [5,6]]" dimensions="' + stringDim + '"></graph></div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    scope.$digest();
  });

  it('should have a svg', function () {
    expect(d3.select(element[0]).select('svg')[0][0]).not.toBeNull();
  });

  it('should have the height set on the element', function () {
    expect(d3.select(element[0]).select('svg').attr('height')).toBe(String(dimensions.height));
  });

  it('should have the width set on the element', function () {
    expect(d3.select(element[0]).select('svg').attr('width')).toBe(String(dimensions.width));
  });

  it('should shift the drawing area to create space for the labels', function () {
    var translate = "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")";
    var transform = d3.select(element[0]).select('svg').select('g').attr('transform');
    expect(transform).toBe(translate);
  });

  it('should include a rect of the right size', function () {
    var rect = d3.select(element[0]).select('svg').select('g').select('rect');
    expect(rect.attr('width')).toBe(String(dimensions.width - dimensions.padding.left - dimensions.padding.right));
    expect(rect.attr('height')).toBe(String(dimensions.height - dimensions.padding.top - dimensions.padding.bottom));
  });

  it('should have a rect which does not have "fill:none" cause that breaks the listeners', function () {
    var rect = d3.select(element[0]).select('svg').select('g').select('rect');
    expect(rect.style('fill')).not.toBe('none');
  });

});

describe('Testing line graph attribute directive', function() {

  var $compile, $rootScope, element, scope, dimensions;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  beforeEach(function () {
    dimensions = {
      width: 100,
      height: 90,
      padding: {
        top: 1,
        left: 2,
        right: 3,
        bottom: 4
      }
    };
    var stringDim = '{width: ' + String(dimensions.width) + ', height: ' + String(dimensions.height)
    + ', padding: ' + '{top: ' + String(dimensions.padding.top) + ', left: ' + String(dimensions.padding.left)
    + ', right: ' + String(dimensions.padding.right) + ', bottom: ' + String(dimensions.padding.bottom) + '}}';
    element = angular.element('<div>' +
      '<graph line data="[[3, 4], [2,3], [5,6]]" dimensions="' + stringDim + '"></graph></div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    scope.$digest();
  });

  it('should draw a line', function () {
    expect(d3.select(element[0]).select('path')[0][0]).not.toBeNull();
  });

  it('should draw labels inside the padding area', function () {
    var label = d3.select(element[0]).select('#xlabel');
    expect(label.attr('x') - label.node().offsetWidth > 0).toBe(true);
    expect(label.attr('y') < dimensions.height).toBe(true);
    expect(label.attr('y') > dimensions.height - dimensions.padding.bottom).toBe(true);
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

describe('Testing graph', function () {
  var graph, dimensions;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    var Graph = $injector.get('Graph');
    var element = angular.element('<svg></svg>')[0];
    dimensions = {
      width: 120,
      height: 100,
      padding: {
        top: 1,
        right: 2,
        bottom: 3,
        left: 4
      }
    };
    graph = new Graph(element, dimensions);
  }));

  it('should create a canvas with certain width', function () {
    expect(graph.svg.attr('width')).toBe(String(dimensions.width));
  });

  it('should create a clippath drawing area ', function () {
    var clippath = graph.svg.select('g').select('g').attr('clip-path');
    expect(clippath).toBe('url(#clip)');
  });

  it('should transform the drawing area to create a padding', function () {
    var translate = "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")";
    var transform = graph.svg.select('g').attr('transform');
    expect(transform).toBe(translate);
  });

});
