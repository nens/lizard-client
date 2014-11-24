'use strict';

describe('Directives: Search', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate serviced,
  var scope, element;
  beforeEach(inject(function ($rootScope, $compile) {
    scope = $rootScope;
    element = angular.element('<search></search>');
    $compile(element)($rootScope);
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

  it('should destroy location model', function () {
    // destroy is a private function so we call the function
    // calling it.
    scope.zoomTo({boundingbox: null});
    expect(scope.box.content.hasOwnProperty('location')).toBe(false);
  });

});
