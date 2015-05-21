// time-controller-tests.js

describe('Testing time controller', function () {
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

  it('should set animatable to true when temporal layers', function () {
    State.temporal.timelineMoving = true;
    DataService.toggleLayerGroup(DataService.layerGroups['alarm']);
    $rootScope.$digest();
    expect(timeScope.animatable).not.toBeDefined();
    State.temporal.timelineMoving = false;
    $rootScope.$digest(); // triggers configAnimation
    expect(timeScope.animatable).toBe(true);
    // There are animatable layers
  });

  it('should zoom in by a factor 2', function () {
    State.temporal.start = 2000;
    State.temporal.end = 4000;
    timeScope.zoom('in');
    $rootScope.$digest();
    expect(State.temporal.start).toBe(2500);
    expect(State.temporal.end).toBe(3500);
  });

});
