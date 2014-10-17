// point-object-ctrl-tests.js

describe('Testing point object controller', function () {
  var boxScope,
    $rootScope,
    pointScope,
    $controller;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');

    boxScope = $rootScope.$new();

    boxScope.box = {
      content: undefined,
      type: 'point'
    };

    boxScope.mapState = {
      here: L.LatLng(51, 6)
    };

    var ClickFeedbackService = {
      drawClickInSpace: function (map, here) {return true; }
    };

    $controller('OmniboxCtrl', {$scope: boxScope});
    pointScope = boxScope.$new();
    $controller('PointCtrl', {
      $scope: pointScope,
      ClickFeedbackService: ClickFeedbackService
    });
  }));

  it('should create a pointObject on scope at creation', function () {
    expect(pointScope.box.content).toBeDefined();
  });

});
