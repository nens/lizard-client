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
    // Make a DOM element: make string from object and replace all double quotes
    // for single quotes and put it in the domstring and compile it to DOM.
    var stringDim = JSON.stringify(dimensions).replace(/["]/g, "'");

    var content = [{
      data: [[3, 4], [2,3], [5,6]],
      id: 'abc',
      unit: '...',
      color: 'red',
      keys: {x: 0, y: 1}
    }];
    var contentString = JSON.stringify(content).replace(/["]/g, "'");
    domstring = '<div>'+
      '<graph line content="' + contentString +
      '" dimensions="' + stringDim +
      '"></graph></div>';
    element = angular.element(domstring);
    element = $compile(element)($rootScope);
    scope = element.scope();
    scope.$digest();
  });

  it('should draw a line', function () {
    expect(d3.select(element[0]).select('path').empty()).toBe(false);
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
    var dataString = '[ {data: [[3, 4], [2,3], [5,6]], keys: {x: 0, y: 1}, labels: {x: 0, y: 1} } ]';
    temporal = "{start: 0, end: 1000}";
    element = angular.element('<div>' +
      '<graph bar-chart content="' + dataString + '" temporal="' + temporal +'" now="234"></graph></div>');
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
    var dataString = '[ {data: [[3, 4], [2,3], [5,6]], keys: {x: 0, y: 1}, labels: {x: 0, y: 1} } ]';
    element = angular.element('<div>' +
      '<graph horizontal-stack content="' + dataString + '"></graph></div>');
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
      temporal = {start: 0, end: 1000};
      graph = new Graph(el, dimensions, temporal);
    })
  );

  it('should create a canvas with certain width', function () {
    expect(graph._svg.attr('width')).toBe(String(dimensions.width));
  });

  it('should create a clippath drawing area ', function () {
    var clippath = graph._svg.select('g').select('g').attr('clip-path');
    var height = dimensions.height - dimensions.padding.bottom;
    expect(clippath).toBe('url(http://server/#clip' + height + ')');
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
    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }]);
    expect(graph._xy).not.toBe(undefined);
  });

  it('should have an xy with scales', function () {

    var data = [[0, 0], [1, 3], [2, 1]],
        keys = {x: 0, y: 1},
        labels = {x: 'afstand', y: 'elevation'},
        height = dimensions.height - dimensions.padding.bottom,
        width = dimensions.width - dimensions.padding.left - dimensions.padding.right;

    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }]);
    // expect(graph._xy.x.scale(graph._xy.x.maxMin.max)).toBe(width);

    expect(graph._xy.x.scale(0)).toBe(0);
    expect(graph._xy.y.scale(graph._xy.y.maxMin.max)).toBe(0);
    expect(graph._xy.y.scale(0)).toBe(height);
  });

  it('should have an xy with axes', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }]);
    expect(graph._xy.y.axis.name).toBe('axis');
    expect(graph._xy.x.axis.name).toBe('axis');
  });

  it('should rescale the x when max or min changes', function () {
    var data = [[0, 0], [1, 3], [2, 1]];
    keys = {x: 0, y: 1},
    labels = {x: 'afstand', y: 'elevation'},
    graph.drawLine([{
      data: data,
      keys: keys,
      unit: labels.y,
      xLabel: labels.x
    }]);
    expect(graph._xy.x.scale.domain()[0]).toBe(0);
    expect(graph._xy.x.scale.domain()[1]).toBe(2);
    data[0][0] = -1;
    data[2][0] = 4;
    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }]);
    expect(graph._xy.x.scale.domain()[0]).toBe(-1);
    expect(graph._xy.x.scale.domain()[1]).toBe(4);
  });

  it('should rescale the y when max increase', function () {

    var data = [[0, 0], [1, 3], [2, 1]],
        keys = {x: 0, y: 1},
        labels = {x: 'afstand', y: 'elevation'};

    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }]);
    expect(graph._xy.y.maxMin.max).toBe(3);
    data[0][1] = 4;
    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }]);
    expect(graph._xy.y.maxMin.max).toBe(4);
  });

  it('should rescale the y when max halves', function () {

    var data = [[0, 0], [1, 3], [2, 1]],
        keys = {x: 0, y: 1},
        labels = {x: 'afstand', y: 'elevation'};

    graph.drawLine([{
      data: data,
      keys: keys,
      unit: labels.y,
      xLabel: labels.x
    }]);
    expect(graph._xy.y.maxMin.max).toBe(3);
    data[1][1] = 1.5;

    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }]);

    expect(graph._xy.y.maxMin.max).toBe(1.5);
  });

  it('should rescale the y when max diminishes', function () {

    var data = [[0, 0], [1, 3], [2, 1]],
        keys = {x: 0, y: 1},
        labels = {x: 'afstand', y: 'elevation'};

    graph.drawLine([{
      data: data,
      keys: keys,
      unit: labels.y,
      xLabel: labels.x
    }]);

    expect(graph._xy.y.maxMin.max).toBe(3);
    data[1][1] = 0.2;
    data[2][1] = 0.2;
    graph.drawLine([{
      data: data,
      keys: keys,
      unit: labels.y,
      xLabel: labels.x
    }]);
    expect(graph._xy.y.maxMin.max).toBe(0.2);
  });

  it('should create a barchart with time on the x scale', function () {
    var data = [[1409748900000, 0], [1409752500000, 1], [1409756100000, 3]],
        keys = {x: 0, y: 1},
        labels = {x: 'afstand', y: 'elevation'},
        quantity = 'time';
    graph.drawBars([{
      data: data,
      keys: keys,
      labels: labels
    }], quantity);
    expect(graph._xy.x.scale.domain()[0] instanceof Date).toBe(true);
  });

  it('should draw bars on the same x location for stacked barchart', function () {
    var data = [
        {"timestamp":"1338501600000","category":"Wateroverlast binnenshuis","count":2},
        {"timestamp":"1338501600000","category":"Riolering","count":8},
        {"timestamp":"1338501600000","category":"Wateroverlast buitenshuis","count":4}
      ],
      keys = {x: 'timestamp', y: 'count', category: 'category'},
      labels = {x: 'afstand', y: 'elevation'},
      quantity = 'time';
    graph.drawBars([{
      data: data,
      keys: keys,
      labels: labels
    }], quantity);
    var bars = graph._svg.select('g').select('#feature-group').selectAll(".bar");
    expect(bars[0][0].getAttribute('x')).toEqual(bars[0][2].getAttribute('x'));
  });

  it('should draw bars on top of other bars for stacked barchart', function () {
      var data = [
          {"timestamp":"1338501600000","category":"Wateroverlast binnenshuis","count":2},
          {"timestamp":"1338501600000","category":"Riolering","count":8},
          {"timestamp":"1338501600000","category":"Wateroverlast buitenshuis","count":4}
        ],
      keys = {x: 'timestamp', y: 'count', category: 'category'},
      labels = {x: 'afstand', y: 'elevation'},
      quantity = 'time';
    graph.drawBars([{
      data: data,
      keys: keys,
      labels: labels
    }], quantity);
    var bars = graph._svg.select('g').select('#feature-group').selectAll(".bar");
    var yValue = Number(bars[0][0].getAttribute('y'));
    var yValue2 = Number(bars[0][1].getAttribute('y')) - Number(bars[0][1].getAttribute('height'));
    expect(yValue).toEqual(yValue2);
  });

  it('should draw a now element at the right place', function () {
    var data = [[1409748900000, 0], [1409752500000, 1], [1409756100000, 3]],
      keys = {x: 0, y: 1},
      labels = {x: 'afstand', y: 'elevation'},
      quantity = 'time';
    graph.drawBars([{
      data: data,
      keys: keys,
      labels: labels
    }], quantity);
    graph.drawNow(data[1][0]);
    var indicator = graph._svg.select('g').select('#feature-group').select('.now-indicator');
    expect(indicator.attr('x1')).toEqual(String(graph._xy.x.scale(data[1][0])));
  });

  it('should draw a line with a subset of the data when useSubset', function () {
    var data = [[1,1], [2,4], [3,2], [4,0], [5,4], [6,2], [7,0], [8,4], [9,2],
                [10,0], [11,4], [12,2], [13,0], [14,4], [15,2], [16,0],
                [17,4], [18,2], [19,0], [20,4], [21,2], [22,0], [23,4], [24,2]],
        keys = {x: 0, y: 1},
        labels = {x: 'afstand', y: 'elevation'},
        temporal = false,
        useSubset = true;
    graph.drawLine([{
      data: data,
      keys: keys,
      labels: labels
    }], temporal, useSubset);
    var path = graph._svg.select('#feature-group').select('path');
    expect(path.data()[0].length).toBe(5);
  });

  it('should draw a line with full dataset when useSubset = false',
    function () {
      var data = [[1,1], [2,4], [3,2], [4,0], [5,4], [6,2], [7,0], [8,4], [9,2],
                  [10,0], [11,4], [12,2], [13,0], [14,4], [15,2], [16,0],
                  [17,4], [18,2], [19,0], [20,4], [21,2], [22,0], [23,4], [24,2]],
          keys = {x: 0, y: 1},
          labels = {x: 'afstand', y: 'elevation'},
          temporal = false,
          useSubset = false;
      graph.drawLine([{
        data: data,
        keys: keys,
        labels: labels
      }], temporal, useSubset);
      var path = graph._svg.select('#feature-group').select('path');
      expect(path.data()[0].length).toBe(data.length);
    }
  );

  it('should use a transition duration of 0 when quickly calling _getTransTime',
    function () {
      var first = graph._getTransTime();
      expect(first).toBe(graph.transTime);
      var second = graph._getTransTime();
      expect(second).toBe(0);
    }
  );


});
