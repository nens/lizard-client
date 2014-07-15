// raster-aggregate-tests.js

describe('Testing raster directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend, $q, element, scope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    element = angular.element('<div ng-controller="RasterAggregateCtrl">'
      + '</div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
  }));

  it('should have extentAggregate model with a certain structure', function () {

    var extentAggregate = {
      changed: true,
      landuse: {
        active: false,
        data: [],
        q: scope.extentAggregate.landuse.q
      },
      soil: {
        active: false,
        data: [],
        types: [],
        q: scope.extentAggregate.soil.q
      },
      elevation: {
        active: false,
        data: [],
        q: scope.extentAggregate.elevation.q
      }
    };
    expect(scope.extentAggregate).toEqual(extentAggregate);
  });

  it('should Refresh Promises', function () {
    var copyQ = scope.extentAggregate.landuse.q
    // run the function
    scope.extAggPromiseRefresh();
    // make sure the q object set in said function is not the same
    // as the 'copy'
    expect(copyQ).not.toEqual(scope.extentAggregate.landuse.q);
  });

  it('should update the landuse data object with the response', function () {
    var dataBefore = scope.extentAggregate.landuse.data.length;

    scope.handleLanduseCount([{"color": "#000000", "data": 256786, "label": 0},
     {"color": "#e7e3e7", "data": 5089, "label": 241},
     {"color": "#a5ff73", "data": 73, "label": "41 - LGN - Agrarisch Gras"},
     {"color": "#0071ff", "data": 39, "label": "21 - Top10 - Water"},
     {"color": "#c65d63", "data": 27, "label": "63 - CBS - Woongebied"},
     {"color": "#734d00", "data": 17, "label": "46 - LGN - Overige akkerbouw"},
     {"color": "#6b696b", "data": 13, "label": "23 - Top10 - Secundaire wegen"},
     {"color": "#00714a", "data": 12, "label": "25 - Top10 - Bos/Natuur"},
     {"color": "#f7385a", "data": 11, "label": "65 - CBS - Bedrijventerrein"},
     {"color": "#ffffff", "data": 77.0, "label": "Overig"}]);
    expect(dataBefore).not.toEqual(scope.extentAggregate.landuse.data.length)
  });

  it('should update the elevation data object with the response', function () {
    var dataBefore = scope.extentAggregate.elevation.data.length;

    scope.handleElevationCurve([
      [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0,
        10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0,
        23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0,
        36.0, 37.0, 38.0, 39.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 47.0, 48.0,
        49.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 57.0, 58.0, 59.0, 60.0, 61.0,
        62.0, 63.0, 64.0, 65.0, 66.0, 67.0, 68.0, 69.0, 70.0, 71.0, 72.0, 73.0, 74.0,
        75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 81.0, 82.0, 83.0, 84.0, 85.0, 86.0, 87.0,
        88.0, 89.0, 90.0, 91.0, 92.0, 93.0, 94.0, 95.0, 96.0, 97.0, 98.0, 99.0, 100.0],
      [
        7.564827924594283, 7.564827924594283, 7.564827924594283, 8.37517404044047,
        8.530346700921655, 8.64241584460251, 8.720002174843103, 8.797588505083695,
        8.875174835324287, 8.949887597778192, 9.001611817938587, 9.053336038098982,
        9.105060258259376, 9.156784478419771, 9.208508698580166, 9.260232918740561,
        9.32345141004771, 9.401037740288302, 9.478624070528895, 9.556210400769487,
        9.63379673101008, 9.711383061250672, 9.788969391491264, 9.866555721731856,
        9.944142051972449, 9.995866272132844, 10.026900804229081, 10.057935336325318,
        10.088969868421554, 10.120004400517791, 10.151038932614028, 10.182073464710266,
        10.213107996806503, 10.244142528902739, 10.275177060998976, 10.306211593095213,
        10.33724612519145, 10.368280657287688, 10.399315189383923, 10.43034972148016,
        10.461384253576398, 10.492418785672635, 10.523453317768872, 10.554487849865108,
        10.585522381961345, 10.616556914057583, 10.64759144615382, 10.694143244298175,
        10.771729574538767, 10.84931590477936, 10.926902235019952, 11.004488565260544,
        11.151040522381663, 11.306213182862848, 11.461385843344033, 11.616558503825217,
        11.771731164306402, 11.926903824787587, 12.771732754074037, 12.926905414555222,
        13.082078075036407, 13.159664405276999, 13.237250735517591, 13.314837065758184,
        13.392423395998776, 13.513113243039697, 13.668285903520884, 14.513114832807334,
        14.668287493288517, 24.478647917043418, 24.633820577524602, 24.788993238005787,
        27.702790973708034, 27.85796363418922, 35.89245916577056, 35.97004549601115,
        36.047631826251745, 36.12521815649234, 47.944202463142574, 48.09937512362376,
        51.35800099372864, 51.51317365420982, 51.66834631469101, 55.27180031919852,
        55.426972979679704, 59.030426984187216, 59.1855996446684, 70.72010074043646,
        70.87527340091765, 80.34080569026992, 80.4959783507511, 80.65115101123229,
        82.185636209324, 82.34080886980519, 85.25460660550743, 85.40977926598862,
        90.39254580810666, 90.54771846858785, 95.18565687630326, 95.34082953678444,
        95.49600219726562]]);
    expect(dataBefore).not.toEqual(scope.extentAggregate.elevation.data.length)
  });

});
