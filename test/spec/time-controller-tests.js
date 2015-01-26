// time-controller-tests.js

describe('Testing omniboxCtrl', function () {
  var $controller,
      $rootScope,
      timeScope,
      State,
      DataService;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    State = $injector.get('State');
    DataService = $injector.get('DataService');

    timeScope = $controller('TimeCtrl', {$scope: $rootScope.$new()});

  }));

  it('should return one promise', function () {
    State.temporal.timelineMoving = true;
    DataService.toggleLayerGroup(DataService.layerGroups['alarm']);
    $rootScope.$digest();
    expect(timeScope.animatable).not.toBeDefined();
    State.temporal.timelineMoving = false;
    $rootScope.$digest(); // triggers configAnimation
    expect(timeScope.animatable).toBe(true);
    // There are animatable layers
  });

});