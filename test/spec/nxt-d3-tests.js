
describe('Testing NxtD3', function () {
  var nxtD3, dimensions, $compile, $rootScope;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function (_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
      })
  );

  beforeEach(inject(
    function ($injector) {
      var NxtD3 = $injector.get('NxtD3'),
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
      };
      nxtD3 = new NxtD3(el, dimensions);
    })
  );

  it('should have a transTime and it should be a number', function () {
    expect(nxtD3.transTime).toEqual(jasmine.any(Number));
  });

  it('should have a _localeFormatter with Dutch', function () {
    expect(nxtD3._localeFormatter).toBeDefined();
    expect(nxtD3._localeFormatter['nl_NL']).toBeDefined();
  });

  it('should return maxmin, d3 scale and d3 axis', function () {
    var data = [[0, 0], [1, 3], [2, 1]],
    keys = {x: 0, y: 1},
    options = {scale: 'linear'};
    var objects = nxtD3._createD3Objects(data, keys.x, options, false);
    expect(objects.maxMin.max).toEqual(2);
    expect(objects.scale(2)).toEqual(114);
    expect(objects.axis).toBeDefined();
  });

  it('should return maxmin for string values', function () {
    var data = [[0, '0'], ['1', '3'], ['2', 1]],
        maxMin = nxtD3._maxMin(data, 1);
    expect(maxMin.max).toEqual(3);
  });

  it('should return maxmin while ingnoring null values', function () {
    var data = [[0, 0], [1, null], [null, 1]],
        maxMin = nxtD3._maxMin(data, 1);
    expect(maxMin.max).toEqual(1);
  });

  it('should return correct max min for values wrapped in arrays', function () {
    var data = [[0, [1]], [1, [40.1]], [2, [2]]];
        maxMin = nxtD3._maxMin(data, 1);
    expect(maxMin.max).toEqual(40.1);
    expect(maxMin.min).toEqual(1);
  });

  it('should set new dimensions when resized', function () {
    newWidth = 40;
    nxtD3.resize({width: newWidth});
    expect(nxtD3.dimensions.width).toEqual(newWidth);
  });

  it('should not set undefined dimension attributes to undefined when resized',
    function () {
      nxtD3.resize({width: 40});
      expect(nxtD3.dimensions.height).toBeDefined();
    }
  );

});

