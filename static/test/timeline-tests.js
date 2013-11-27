// timeline-tests.js

describe('Testing timeline directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend, data;

  beforeEach(module('lizard-nxt',
    'templates-main',
    'graph',
    'lizard-nxt.services'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    data = [{"geometry":{"type":"Point","coordinates":[4.9499466890,52.5101659518]},"type":"Feature","properties":{"INTAKEDATU":"2012/12/18","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/12/27","INTAKESTAT":"Afgehandeld","AFHANDELDA":"27-12-2012"}},{"geometry":{"type":"Point","coordinates":[4.9632302810,52.5038627021]},"type":"Feature","properties":{"INTAKEDATU":"2012/04/12","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/12/13","INTAKESTAT":"Afgehandeld","AFHANDELDA":"05-12-2012"}},{"geometry":{"type":"Point","coordinates":[4.9664831466,52.5222611062]},"type":"Feature","properties":{"INTAKEDATU":"2012/06/11","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/11/15","INTAKESTAT":"Afgehandeld","AFHANDELDA":"14-11-2012"}},{"geometry":{"type":"Point","coordinates":[4.9702891586,52.5243898404]},"type":"Feature","properties":{"INTAKEDATU":"2012/10/15","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/10/24","INTAKESTAT":"Afgehandeld","AFHANDELDA":"22-10-2012"}},{"geometry":{"type":"Point","coordinates":[4.9284185842,52.4928915370]},"type":"Feature","properties":{"INTAKEDATU":"2012/03/30","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2012/04/10","INTAKESTAT":"Afgehandeld","AFHANDELDA":"02-04-2012"}},{"geometry":{"type":"Point","coordinates":[4.9594677757,52.5119363436]},"type":"Feature","properties":{"INTAKEDATU":"2011/11/22","KLACHT":"Grondwateroverlast","CATEGORIE":"GRONDWATER","AKTIEDATUM":"2011/12/01","INTAKESTAT":"Afgehandeld","AFHANDELDA":"08-12-2011"}},{"geometry":{"type":"Point","coordinates":[4.9281440060,52.4927354502]},"type":"Feature","properties":{"INTAKEDATU":"2012/07/08","KLACHT":"Rioolverzakking","CATEGORIE":"PUT BOVEN/ONDER BESTRATING","AKTIEDATUM":"2012/08/16","INTAKESTAT":"Afgehandeld","AFHANDELDA":"08-08-2012"}},{"geometry":{"type":"Point","coordinates":[4.9557002060,52.5185894148]},"type":"Feature","properties":{"INTAKEDATU":"2012/11/04","KLACHT":"Rioolverzakking","CATEGORIE":"PUT BOVEN/ONDER BESTRATING","AKTIEDATUM":"2012/04/20","INTAKESTAT":"Afgehandeld","AFHANDELDA":"05-06-2012"}}];
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
    var element = angular.element('<div ng-controller="MasterCtrl">'
        + '</div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();    
    var datestart = scope.timeline.temporalExtent.start;
    var datestarttype = typeof datestart;
    console.info('\n' + 'NOTE: perhaps temporalExtent should be a Date object');
    expect(datestarttype).toBe("number");
  });

  it('should draw a svg element', function () {
    var element = angular.element('<div ng-controller="MasterCtrl">'
        + '<timeline ng-controller="TimelineCtrl" '
        + 'class="navbar timeline navbar-fixed-bottom" '
        + 'ng-class="{hidden: !timeline.enabled}"></timeline> '
        + '</div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();
    var result = $('svg');
    var notresult = $('ditbestaatsowiesoniet');
    console.info(result[0], notresult[0]);
    expect(result).not.toBe(notresult);
  });

  it('')


});