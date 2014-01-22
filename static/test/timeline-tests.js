// timeline-tests.js

describe('Testing timeline directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend, data, $controller, ctrl, element, scope;

  beforeEach(module('lizard-nxt',
    'templates-main',
    'graph',
    'lizard-nxt.services'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_, $controller) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $controller = $controller;
    data = {
      "count": 2,
      "next": null, 
      "previous": null,
      "results": [
        {
           "event_type": "Twitter",
           "type":"FeatureCollection",
           "features":[
           {
           "type": "Feature",
           "event_sub_type":"regen",
           "value_type": "ordinal",
           "value":"Cheap\nOnbeperkt SMS+Internet 5,00\n+ 90   min 10,00\n+ 150 minuten 11,00\n+ Onbeperkt bellen 24,00\nCheapsimonly.nl \n#amsterdam #utrecht #regen",
           "timestamp":"1381845388000",
           "geometry":{
              "type":"Point",
              "coordinates":[
                 5.64723048,
                 51.67624188
              ]
           }
        },
        {
           "type": "Feature",
           "event_sub_type":"regen",
           "value_type": "ordinal",
           "value":"De wolken boven Nederland zijn zwart, maar het regent niet.\nDe wind waait hard, maar het is niet koud.\nEen echte herfstdag in ons mooie land",
           "timestamp":"1381997088000",
           "geometry":{
              "type":"Point",
              "coordinates":[
                 4.8181042,
                 52.3835859
              ]
           }
        }
      ]
    }
  ]
};
    element = angular.element('<div ng-controller="MasterCtrl">'
    + '</div>');
    element = $compile(element)($rootScope);
    scope = element.scope();
    ctrl = $controller('TimelineDirCtrl', {$scope: scope});
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

  it('Should create a canvas', function () {
    var svg = $compile(angular.element('<svg></svg>'))(scope);
    var options = {
      width: 100,
      height: 200 };
    var canvas = ctrl.createCanvas(d3.select(svg[0]), options);
    expect(canvas.svg.select('g').select('rect').toString()).toBe('[object SVGRectElement]');
    expect(canvas.height).toBe(options.height - 20 - 3);
    expect(canvas.width).toBe(options.width - 30 - 30);
  });

  it('Should make a scale when input is categorical', function () {
    var minMax = null;
    var range = null;
    var options = { scale: 'ordinal'};
    var scale = ctrl.scale(minMax, range, options);
    expect(scale("regen")).toBe('#2980b9');
  });

  it('Should make an axis function', function () {
    var minMax = {min: Date.now() - 31556900000, max: Date.now()};
    var range = {min: 0, max: 300};
    var options = { type: 'time' };
    var scale = ctrl.scale(minMax, range, options);
    var axis = ctrl.makeAxis(scale, {orientation: 'bottom', ticks: 5});
    expect(typeof(axis)).toBe('function');
  });

  it('INTEGRATION:: Should draw a timeline', function () {
    var svg = $compile(angular.element('<svg></svg>'))(scope);
    var options = {
      width: 100,
      height: 200 };
    var canvas = ctrl.createCanvas(d3.select(svg[0]), options);
    expect(canvas.svg.select('g').select('rect').toString()).toBe('[object SVGRectElement]');
    var minMax = {min: Date.now() - 31556900000, max: Date.now()};
    var range = {min: 0, max: 300};
    var options = { type: 'time' };
    var xScale = ctrl.scale(minMax, range, options);
    var colorScale = ctrl.scale(null, null, { scale: 'ordinal' });
    var yScale = ctrl.scale({min: 1, max: 1}, { min: canvas.height - 20, max: 20 }, {scale: 'linear'});
    var cData = [];
    //Format data
    angular.forEach(data.results[0].features, function (feature) {
      feature.event_type = 1;
      // Create unique id, a combo of time and location. I assume this is always unique..
      feature.id = "" + 'Twitter' + feature.timestamp + feature.geometry.coordinates[0] + feature.geometry.coordinates[1];
      cData.push(feature);
      });
    ctrl.drawCircles(canvas.svg, xScale, yScale, colorScale, 'timestamp', 'event_type', 'event_sub_type', cData);
    scope.timeState.timeline.data.twitter = data.results[0];
    scope.timeState.timeline.data.twitter.active = true;
    scope.timeState.timeline.changed = Date.now();
    window.outerWidth = 1000;
    scope.$apply();
    expect(canvas.svg.selectAll("circle")[0].length).toBe(data.results[0].features.length);
  });

});