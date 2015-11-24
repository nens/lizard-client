'use strict';

describe('Testing RegionController', function () {
   var $controller, $rootScope, $scope, State, mockedCabinetService;

  beforeEach(module('lizard-nxt'));
  beforeEach(module('omnibox'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');

    mockedCabinetService = $injector.get('CabinetService');
    mockedCabinetService.regions.get = function () {
      return { then: function () {} }
    };

    State = $injector.get('State');
    var LeafletService = $injector.get('LeafletService');

    var southWest = L.latLng(40.712, -74.227),
        northEast = L.latLng(40.774, -74.125);
    State.spatial.bounds = LeafletService.latLngBounds(southWest, northEast);

    var timeState = {
      start: 1,
      end: 6,
      at: 3,
      timelineMoving: true
    };

    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

  }));

  it('should not get data for no region', function () {
    var ctrl = $controller('RegionCtrl', {$scope: $scope, CabinetService: mockedCabinetService});
    $scope.fillBox = function () {return {then: function () {}}; }; // mock fillbox to not try to get data.
    $scope.$digest();
    expect($scope.activeName).toBeUndefined();
  });

  it('should get data when region is defined', function () {
    var ctrl = $controller('RegionCtrl', {$scope: $scope, CabinetService: mockedCabinetService});
    $scope.fillBox = function () {return {then: function () {}}; }; // mock fillbox to not try to get data.
    State.spatial.region = {id: 1, properties: {name: 'district name'}};
    $scope.$digest();
    expect($scope.activeName).toBeDefined();

  });

});
