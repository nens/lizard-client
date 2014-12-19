// omnibox-tests.js

describe('Testing omniboxCtrl', function () {
  var $controller,
    boxScope,
    result;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    var $rootScope = $injector.get('$rootScope');
    $injector.get('$controller');
    boxScope = $rootScope.$new();

    boxScope.box = {
      content: {},
      type: 'point'
    };

    result = [[1, [2, 3, 4]], [2, [3, 4, 5]], [3, [4, 5, 6]]];

    $controller('OmniboxCtrl', {$scope: boxScope});

  }));

  it('should have a fillBox function', function () {
    expect(boxScope.fillBox).toBeDefined();
  });

  it('should return a promise for every data_layer', function () {
    expect(boxScope.fillBox(new L.LatLng(51,6)).length).toEqual(Object.keys(data_layers).length);
  });


});