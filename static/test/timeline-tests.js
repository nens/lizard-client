// timeline-tests.js

describe('Testing timeline directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend;

  beforeEach(module('lizard-nxt',
    'templates-main',
    'graph',
    'lizard-nxt.services'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  it('should have d3 available', function () {
    if (d3 === undefined){
        var result = false;
    } else {
        var result = true;
    }
    expect(result).toBe(true);
  });

  it('should draw a svg element', function () {
    var element = angular.element('<div ng-controller="MasterCtrl">'
        + '<timeline ng-controller="TimelineCtrl" class="navbar timeline '
        + 'navbar-fixed-bottom" '
        + 'ng-class="{hidden: !timeline.enabled}"></timeline> '
        + '</div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();
  });


});