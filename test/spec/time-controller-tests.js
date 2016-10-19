// time-controller-tests.js

describe('Testing time controller', function () {
  var $controller,
      $rootScope,
      timeScope,
      State,
      rasterMapLayer,
      MapService;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    rasterMapLayer = $injector.get('rasterMapLayer');
    $rootScope = $injector.get('$rootScope');
    State = $injector.get('State');
    MapService = $injector.get('MapService');

    timeScope = $controller('TimeCtrl', {$scope: $rootScope.$new()});

  }));

  it('should set animatable to true when temporal layers', function () {
    State.temporal.timelineMoving = true;
    $rootScope.$digest();
    expect(timeScope.animatable).toBe(false);

    var uuid = 'asdfsadf';

    State.layers = [{active: true, uuid: uuid}];

    var temporalLayer = rasterMapLayer({
      uuid: uuid,
      slug: 'rain',
      temporalResolution: 36000,
      temporal: true,
      complexWmsOptions: {}
    });

    MapService.mapLayers.push(temporalLayer);

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
