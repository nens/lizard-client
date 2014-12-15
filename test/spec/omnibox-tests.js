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
    var NxtMap = $injector.get('NxtMap');

    boxScope = $rootScope.$new();

    boxScope.box = {
      content: undefined,
      type: 'point'
    };

    result = [[1, [2, 3, 4]], [2, [3, 4, 5]], [3, [4, 5, 6]]];

    boxScope.mapState = new NxtMap(angular.element('<div></div>')[0], data_layers, {
      zoomControl: false
    });

    $controller('OmniboxCtrl', {$scope: boxScope});

  }));

  it('should have an empty box', function () {
    expect(boxScope.box.content).toBeDefined();
  });

  it('should have a fillBox function', function () {
    expect(boxScope.fillBox).toBeDefined();
  });

  it('should return a promise for every data_layer', function () {
    expect(boxScope.fillBox(new L.LatLng(51,6)).length).toEqual(Object.keys(data_layers).length);
  });

  // TODO: make mock layergroup.getData and enable this function
  // it('should add data to box.content for active layergroups', function () {
  //   boxScope.mapState.toggleLayerGroup(boxScope.mapState.layerGroups.elevation);
  //   boxScope.fillBox(new L.LatLng(51,6));
  //   expect(boxScope.box.content.elevation.layers.data).toEqual(result);
  // });

});