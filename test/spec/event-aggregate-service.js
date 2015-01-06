// event-aggregate-service-tests.js

describe('Testing event aggregate service', function () {
  var $scope, $rootScope, EventAggregateService, timeState;

  timeState = {
    'aggWindow': 3600000
  };

  beforeEach(module('lizard-nxt'));

  var geojsonmock;
  beforeEach(inject(function (_geoJsonMock_, _eventMock_) {
    geojsonmock = _geoJsonMock_;
    eventsMock = _eventMock_;
  }));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    EventAggregateService = $injector.get('EventAggregateService');
  }));

  it("should return an array with property 'count' is 1 for the first element", function () {
    var data = geojsonmock.features;

    var result = EventAggregateService.aggregate(data, timeState.aggWindow, "#f00");
    expect(result[0].count).toBe(1);
  });

  it("should return an array with property 'min' is 2 for the first element", function () {
    var data = eventsMock.features;
    var result = EventAggregateService.aggregate(data, timeState.aggWindow, "#f00");
    expect(result[0].min).toBe(2);
  });

  it("should return an array with property 'mean' is 3 for the first element", function () {
    var data = eventsMock.features;
    var result = EventAggregateService.aggregate(data, timeState.aggWindow, "#f00");
    expect(result[0].mean).toBe(3);
  });

  it("should return an array with property 'count' is 3 for the first element", function () {
    var data = eventsMock.features;
    var result = EventAggregateService.aggregate(data, timeState.aggWindow, "#f00");
    expect(result[0].count).toBe(3);
  });

});
