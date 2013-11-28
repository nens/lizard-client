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
    data = [{"geometry":{"type":"Point","coordinates":[4.9499466890,52.5101659518]},"type":"Feature","properties":{"INTAKEDATU":"2012/12/18","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/12/27","INTAKESTAT":"Afgehandeld","AFHANDELDA":"27-12-2012"}},{"geometry":{"type":"Point","coordinates":[4.9632302810,52.5038627021]},"type":"Feature","properties":{"INTAKEDATU":"2012/04/12","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/12/13","INTAKESTAT":"Afgehandeld","AFHANDELDA":"05-12-2012"}},{"geometry":{"type":"Point","coordinates":[4.9664831466,52.5222611062]},"type":"Feature","properties":{"INTAKEDATU":"2012/06/11","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/11/15","INTAKESTAT":"Afgehandeld","AFHANDELDA":"14-11-2012"}},{"geometry":{"type":"Point","coordinates":[4.9702891586,52.5243898404]},"type":"Feature","properties":{"INTAKEDATU":"2012/10/15","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/10/24","INTAKESTAT":"Afgehandeld","AFHANDELDA":"22-10-2012"}},{"geometry":{"type":"Point","coordinates":[4.9284185842,52.4928915370]},"type":"Feature","properties":{"INTAKEDATU":"2012/03/30","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/04/10","INTAKESTAT":"Afgehandeld","AFHANDELDA":"02-04-2012"}},{"geometry":{"type":"Point","coordinates":[4.9594677757,52.5119363436]},"type":"Feature","properties":{"INTAKEDATU":"2011/11/22","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2011/12/01","INTAKESTAT":"Afgehandeld","AFHANDELDA":"08-12-2011"}},{"geometry":{"type":"Point","coordinates":[4.9281440060,52.4927354502]},"type":"Feature","properties":{"INTAKEDATU":"2012/07/08","KLACHT":"Rioolverzakking","CATEGORIE":"PUT BOVEN/ONDER BESTRATING","AKTIEDATUM":"2012/08/16","INTAKESTAT":"Afgehandeld","AFHANDELDA":"08-08-2012"}},{"geometry":{"type":"Point","coordinates":[4.9557002060,52.5185894148]},"type":"Feature","properties":{"INTAKEDATU":"2012/11/04","KLACHT":"Rioolverzakking","CATEGORIE":"PUT BOVEN/ONDER BESTRATING","AKTIEDATUM":"2012/04/20","INTAKESTAT":"Afgehandeld","AFHANDELDA":"05-06-2012"}}];
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

  it('Should return the min max of numerical data, whether it be time or not', function () {
    var mockdata = [{date: 48, value: 13}, {date: 13, value: 1102}, {date: 13, value: 670}];
    var minMax = ctrl._numericalMinMax(mockdata, {key: 'value'});
    expect(minMax.max).toBe(1102);
    expect(minMax.min).toBe(13);
  });

  it('Should return the min max of data in a time string format', function () {
    var minMax = ctrl._dateStringMinMax(data, {key: "INTAKEDATU"});
    console.info('\n NOTE: data key is still "hardcoded" variable \n'
      + 'because data is from geojson');
    expect(minMax.min).toBe(1321916400000);
    expect(minMax.max).toBe(1355785200000);
  });

  it('Should make a scale when input is categorical', function () {
    var minMax = ctrl._dateStringMinMax(data, {key: "INTAKEDATU"});
    var options = { scale: 'ordinal'};
    var scale = ctrl.scale(minMax, options);
    expect(scale("GRONDWATER")).toBe('#fc8d62');
  });

  // it('Should draw axes', function () {
  //   var canvas = ctrl.createCanvas(directiveElement, options);
  //   var svg = canvas.svg;
  //   //var x = 
  // });

});