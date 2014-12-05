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
    expect(rect.attr('height')).toBe(String(dimensions.height - dimensions.padding.bottom));
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

  it

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
  var graph, dimensions, $compile, $rootScope;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function (_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    })
  );

  beforeEach(inject(function ($injector) {
      var Graph = $injector.get('Graph'),
      element = angular.element('<div><svg></svg></div>'),
      el = element[0].firstChild;
      dimensions = {
        width: 120,
        height: 100,
        padding: {
          top: 1,
          right: 2,
          bottom: 3,
          left: 4
        }
      },
      graph = new Graph(el, dimensions);
    })
  );

  it('should create a canvas with certain width', function () {
    expect(graph._svg.attr('width')).toBe(String(dimensions.width));
  });

  it('should create a clippath drawing area ', function () {
    var clippath = graph._svg.select('g').select('g').attr('clip-path');
    var height = dimensions.height - dimensions.padding.bottom;
    expect(clippath).toBe('url(#clip' + height + ')');
  });

  it('should transform the drawing area to create a padding', function () {
    var translate = "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")";
    var transform = graph._svg.select('g').attr('transform');
    expect(transform).toBe(translate);
  });

  it('should create xy when drawing a line', function () {
    var data = [[0, 0], [1, 3], [2, 1]],
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'};
    expect(graph._xy).toBe(undefined);
    graph.drawLine(data, keys, labels);
    expect(graph._xy).not.toBe(undefined);
  });

  it('should have an xy with scales', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    height = dimensions.height - dimensions.padding.bottom
    width = dimensions.width - dimensions.padding.left - dimensions.padding.right
    graph.drawLine(data, keys, labels);
    expect(graph._xy.x.scale(graph._xy.x.maxMin.max)).toBe(width);
    expect(graph._xy.x.scale(0)).toBe(0);
    expect(graph._xy.y.scale(graph._xy.y.maxMin.max)).toBe(0);
    expect(graph._xy.y.scale(0)).toBe(height);
  });

  it('should have an xy with axes', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    graph.drawLine(data, keys, labels);
    expect(graph._xy.y.axis.name).toBe('axis');
    expect(graph._xy.x.axis.name).toBe('axis');
  });

  it('should rescale the x when max or min changes', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    graph.drawLine(data, keys, labels);
    expect(graph._xy.x.maxMin.min).toBe(0);
    expect(graph._xy.x.maxMin.max).toBe(2);
    data[0][0] = -1;
    data[2][0] = 3;
    graph.drawLine(data, keys, labels);
    expect(graph._xy.x.maxMin.min).toBe(-1);
    expect(graph._xy.x.maxMin.max).toBe(3);
  });

  it('should rescale the y when max increase', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    graph.drawLine(data, keys, labels);
    expect(graph._xy.y.maxMin.max).toBe(3);
    data[0][1] = 4;
    graph.drawLine(data, keys, labels);
    expect(graph._xy.y.maxMin.max).toBe(4);
  });

  it('should not rescale the y when max halves', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    graph.drawLine(data, keys, labels);
    expect(graph._xy.y.maxMin.max).toBe(3);
    data[1][1] = 1.5;
    graph.drawLine(data, keys, labels);
    expect(graph._xy.y.maxMin.max).toBe(3);
  });

  it('should rescale the y when max diminishes', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    graph.drawLine(data, keys, labels);
    expect(graph._xy.y.maxMin.max).toBe(3);
    data[1][1] = 0.2;
    data[2][1] = 0.2;
    graph.drawLine(data, keys, labels);
    expect(graph._xy.y.maxMin.max).toBe(0.2);
  });

  it('should create a barchart with time on the x scale', function () {
    var data = [[1409748900000, 0], [1409752500000, 1], [1409756100000, 3]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'};
    graph.drawBars(data, keys, labels);
    expect(graph._xy.x.scale.domain()[0] instanceof Date).toBe(true)
  });

  it('should draw bars on the same x location for stacked barchart', function () {
    data = [
      {"timestamp":"1338501600000","category":"Wateroverlast binnenshuis","count":2},
      {"timestamp":"1338501600000","category":"Riolering","count":8},
      {"timestamp":"1338501600000","category":"Wateroverlast buitenshuis","count":4}
    ];
    keys = {x: 'timestamp', y: 'count', category: 'category'};
    labels = {x: 'afstand', y: 'elevation'};
    graph.drawBars(data, keys, labels);
    var bars = graph._svg.select('g').select('#feature-group').selectAll(".bar");
    expect(bars[0][0].getAttribute('x')).toEqual(bars[0][2].getAttribute('x'));
  });

  it('should draw bars on top of other bars for stacked barchart', function () {
    data = [
      {"timestamp":"1338501600000","category":"Wateroverlast binnenshuis","count":2},
      {"timestamp":"1338501600000","category":"Riolering","count":8},
      {"timestamp":"1338501600000","category":"Wateroverlast buitenshuis","count":4}
    ];
    keys = {x: 'timestamp', y: 'count', category: 'category'};
    labels = {x: 'afstand', y: 'elevation'};
    graph.drawBars(data, keys, labels);
    var bars = graph._svg.select('g').select('#feature-group').selectAll(".bar");
    var yValue = Number(bars[0][0].getAttribute('y'));
    var yValue2 = Number(bars[0][1].getAttribute('y')) - Number(bars[0][1].getAttribute('height'));
    console.info(yValue2);
    expect(yValue).toEqual(yValue2);
  });

  it('should draw a now element at the right place', function () {
    var data = [[1409748900000, 0], [1409752500000, 1], [1409756100000, 3]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'};
    graph.drawBars(data, keys, labels);
    graph.drawNow(data[1][0]);
    var indicator = graph._svg.select('g').select('#feature-group').select('.now-indicator');
    expect(indicator.attr('x1')).toEqual(String(graph._xy.x.scale(data[1][0])));
  });

});
