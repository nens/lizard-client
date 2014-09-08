
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

});