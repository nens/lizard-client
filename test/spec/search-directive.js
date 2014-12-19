'use strict';

describe('Directives: Search', function () {
  var MapService, State;
  // load the service's module
  beforeEach(module('lizard-nxt'));

  beforeEach(module('global-state'));
  // instantiate serviced,
  var scope, element;
  beforeEach(inject(function ($rootScope, $compile, $injector) {
    scope = $rootScope;
    element = angular.element('<search></search>');
    $compile(element)($rootScope);
    MapService = $injector.get('MapService');
    State = $injector.get('State');
    var el = angular.element('<div></div>');
    MapService.createMap(el[0], {});
    scope.$digest();
    // create empty object to destroy
    scope.box = {
      content: {
        location: {}
      }
    };

  }));

  it('should build query from input field', function () {
    scope.geoquery = "Amsterdam";
    scope.$digest();
    expect(element[0].querySelector('#searchboxinput').value).toBe("Amsterdam");
  });

  it('should clean the input field', function () {
    scope.cleanInput();
    scope.$digest();
    expect(element[0].querySelector('#searchboxinput').value).toBe("");
  });

  it('should remove content from box when calling cleanInput', function () {
    scope.box.content = {reset: 'content'};
    State.spatial.points = [123, 567];
    scope.cleanInput();
    expect(scope.box.content).toBeDefined();
    expect(State.spatial.points.length).toEqual(0);
    expect(scope.box.content.reset).toBeUndefined();
  });

  it('should destroy location model', function () {
    // destroy is a private function so we call the function
    // calling it.
    scope.zoomTo({boundingbox: null});
    expect(scope.box.content.hasOwnProperty('location')).toBe(false);
  });

});
