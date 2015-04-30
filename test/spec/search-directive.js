'use strict';

describe('Directives: Search', function () {
  var MapService, State;

  module(function($provide) {
    $provide.service('LocationService', function () {
      // Mock promise
      this.search = function (searchString, spatialState) {
        return {
          then: function (cb) { cb({status: 'OVER_QUERY_LIMIT'}); }
        };
      };
    });
  });

  // load the service's module
  beforeEach(module('lizard-nxt'));
  beforeEach(module('global-state'));

  var scope, element;

  beforeEach(inject(function ($rootScope, $compile, $injector) {
    scope = $rootScope;
    MapService = $injector.get('MapService');
    State = $injector.get('State');

    element = angular.element('<search></search>');
    $compile(element)($rootScope);
    var el = angular.element('<div></div>');
    MapService.initializeMap(el[0], {});
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
    scope.zoomTo({
      geometry: {
        viewport: {}
      }
    });
    expect(scope.box.content.hasOwnProperty('location')).toBe(false);
  });

  it(
    'should throw error when response status other than ZERO_RESULTS or OK',
    function () {
      scope.geoquery = 'test';
      // Mocked locationservice will respond whith status 'OVER_QUERY_LIMIT'
      expect(scope.search).toThrow();
    }
  );

});
