describe('Testing AreaCtrl', function () {
  var boxScope,
    $rootScope,
    areaScope,
    NxtMap,
    $controller;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    NxtMap = $injector.get('NxtMap');

    boxScope = $rootScope.$new();

    boxScope.box = {
      content: undefined,
      type: 'area'
    };

    boxScope.mapState = new NxtMap(angular.element('<div></div>')[0], data_layers, {
      zoomControl: false
    });

    $controller('OmniboxCtrl', {$scope: boxScope});
    areaScope = boxScope.$new();
    $controller('AreaCtrl', {
      $scope: areaScope,
    });
  }));

  it('should have an empty area', function () {
    expect(areaScope.box.content).toBeDefined();
  });

});
