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
    ctrl = $controller('TimelineDirCtrl', {$scope:scope});
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
    var datestart = scope.timeline.temporalExtent.start;
    var datestarttype = typeof datestart;
    console.info('\n' + 'NOTE: perhaps temporalExtent should be a Date object');
    expect(datestarttype).toBe("number");
  });

  it('Should create a canvas', function () {
    var directiveElement = angular.element(''
      +'<div><div id="timeline-svg-wrapper">'
      + '<svg></svg>'
      + '</div></div>');
    var options = {
      width: 100,
      height: 200 }
    var canvas = ctrl.createCanvas(directiveElement, options);
    expect(canvas.svg.select('rect').toString()).toBe('[object SVGRectElement]');
    expect(canvas.height).toBe(options.height - 20 - 3);
    expect(canvas.width).toBe(options.width - 20 - 30);
  });

  it('Should make a scale when input is categorical', function () {
    var minMax = {min: Date.now() - 31556900000, max: Date.now()};
    var options = { scale: 'ordinal'};
    var scale = ctrl.scale(minMax, options);
    expect(scale("regen")).toBe('#fc8d62');
  });

  it('Should make an axis function', function () {
    var minMax = {min: Date.now() - 31556900000, max: Date.now()};
    var options = { scale: 'time',
                    range: [0, 300]};
    var scale = ctrl.scale(minMax, options);
    var axis = ctrl.makeAxis(scale, {orientation: 'bottom'});
        var directiveElement = angular.element(''
      +'<div><div id="timeline-svg-wrapper">'
      + '</div></div>');
    var canvas = ctrl.createCanvas(directiveElement, {
      width: 100,
      height: 200 
    });
    expect(typeof(axis)).toBe('function');
  });

  it('INTEGRATION:: Should draw a timeline', function () {
    var timelinelement = angular.element('<div ng-controller="TimelineCtrl">'
      + '<timeline></timeline></div>');
    scope.timeline.data.twitter = data;
    scope.timeline.data.twitter.active = true;
    scope.timeline.changed = !scope.timeline.changed;
    timelinelement = $compile(timelinelement)(scope);
    // timelinescope= timelinelement().scope;
    window.outerWidth = 1000;
    scope.$digest();
    expect(timelinelement[0].getElementsByTagName('circle').length > 0).toBe(true);
  });


  // it('Should draw axes', function () {
  //   var canvas = ctrl.createCanvas(directiveElement, options);
  //   var svg = canvas.svg;
  //   //var x = 
  // });

});