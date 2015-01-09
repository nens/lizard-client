// event-aggregate-service-tests.js

describe('Testing event aggregate service', function () {
  var $scope, $rootScope, UtilService, timeState;

  timeState = {
    'aggWindow': 3600000
  };

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    UtilService = $injector.get('UtilService');
  }));

  it("Should return and rgb triplet for hex color '#F00'", function () {

    var result = UtilService.hexColorToDecimalTriple("#F00");
    expect(result).toEqual([255, 0, 0]);
  });

  it("Should return '#F00' for triplet [255, 0, 0] ", function () {

    var result = UtilService.decimalTripleToHexColor([255, 0, 0]);
    expect(result).toBe("#ff0000");
  });

});
