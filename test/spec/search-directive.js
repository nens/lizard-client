'use strict';

describe('Directives: Search', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate serviced,
  var scope, element;
  beforeEach(inject(function ($rootScope, $compile, $injector) {
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
    var NxtMap = $injector.get('NxtMap');

    scope.mapState = new NxtMap(angular.element('<div></div>')[0], data_layers, {
      zoomControl: false
    });
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
    scope.mapState.points = [123, 567];
    scope.cleanInput();
    expect(scope.box.content).toBeDefined();
    expect(scope.mapState.points.length).toEqual(0);
    expect(scope.box.content.reset).toBeUndefined();
  });

  it('should destroy location model', function () {
    // destroy is a private function so we call the function
    // calling it.
    scope.zoomTo({boundingbox: null});
    expect(scope.box.content.hasOwnProperty('location')).toBe(false);
  });

});
