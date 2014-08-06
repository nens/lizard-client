// timeline-tests.js

describe('Testing timeline directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend, data, $controller, ctrl, element, scope;

  beforeEach(module('lizard-nxt',
    'templates-main',
    'graph'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_, $controller) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $controller = $controller;
    data = {"type": "FeatureCollection",
                    "features": [{
                    "geometry": {"type": "Point", "coordinates": [5.64723048, 51.67624188]},
                     "type": "Feature", 
                     "properties": {"event_sub_type": "regen", "value_type": "ordinal", "event_type": 4, "value": "Cheap\nOnbeperkt SMS+Internet 5,00\n+ 90   min 10,00\n+ 150 minuten 11,00\n+ Onbeperkt bellen 24,00\nCheapsimonly.nl \n#amsterdam #utrecht #regen", "timestamp": 1381845388000}
                   }]};
    element = angular.element('<div ng-controller="MasterCtrl">'
    + '</div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    ctrl = $controller('TimeLine', {$scope: scope});
  }));

  it('should have d3 available', function () {
    if (d3 === undefined){
        var result = false;
    } else {
        var result = true;
    }
    expect(result).toBe(true);
  });

  it('should have a temporal extent available with date as epoch', function () {
    var datestart = scope.timeState.start;
    var datestarttype = typeof datestart;
    expect(datestarttype).toBe("number");
  });



});