// event-aggregate-service-tests.js

describe('Testing util-service functions', function () {
  var $scope, $rootScope, UtilService;

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

  it("Should return a list formatted data for a list raw input data",
      function () {

    var inputData = [[1420070400000, 0.58], [1420149600000, 8.2354]],
        latLng = {lat: 52.7, lng: 5.2},
        expectedResult = [[ '52,7', '5,2', '1-1-2015', '1:00:00', '0,58' ],
                          [ '52,7', '5,2', '1-1-2015', '23:00:00', '8,24' ]];

    var result = UtilService.formatCSVColumns(inputData, latLng);
    expect(result).toEqual(expectedResult);
  });

  it('should be able to format ts data with min max', function () {
    var inputData = [
      {
        timestamp: 1420070400000,
        min: 0.58,
        max: 0.59
      },
      {
        timestamp: 1420149600000,
        min: 8.2354,
        max: 8.2354
      }
    ],
    latLng = {lat: 52.7, lng: 5.2},
    expectedResult = [
      [ '52,7', '5,2', '1-1-2015', '1:00:00', '0,58', '0,59' ],
      [ '52,7', '5,2', '1-1-2015', '23:00:00', '8,24', '8,24' ]
    ];

    var result = UtilService.formatCSVColumns(inputData, latLng);
    expect(result).toEqual(expectedResult);
  });

  it("Should return a list with formatted date and timestamp for an" +
     " epoch timestamp in ms", function () {

    var epoch = 1420070400000,
        expectedResult = ['1-1-2015', '1:00:00'];

    var result = UtilService._formatDate(epoch);
    expect(result).toEqual(expectedResult);
  });

  it("Should return a formatted number for a raw number", function () {

    var number = 3.872,
        leadingDigits = 3,
        trailingDigits = 4,
        expectedResult = '003.8720';

    var result = UtilService.formatNumber(number,
                                          leadingDigits,
                                          trailingDigits);
    expect(result).toEqual(expectedResult);
  });

  it("Should return a Dutchified formatted number for a raw number",
      function () {

    var number = 3.872,
        leadingDigits = 3,
        trailingDigits = 4,
        expectedResult = '003,8720';

    var result = UtilService.formatNumber(number,
                                          leadingDigits,
                                          trailingDigits,
                                          true);
    expect(result).toEqual(expectedResult);
  });
});
