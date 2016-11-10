'use strict';

describe('Directives: Search with mocked CabinetService', function () {
  var MapService, State;

  var SearchService = function () {
    // Mock promise
    this.henk = 'piet';
    this.geocode = {
      get: function (searchString, spatialState) {
        return {
          then: function (cb) { cb({status: 'OVER_QUERY_LIMIT'}); }
        };
      }
    };
    this.search = {
      get: function (searchString, spatialState) {
        return {
          then: function (cb) { cb({henk: 'hai'}); }
        };
      }
    };
    this.cancel = function () {};
  };

  // load the service's module
  beforeEach(module('lizard-nxt'));
  beforeEach(module('global-state'));
  beforeEach(function () {
    module(function ($provide) {
      $provide.service('SearchService', SearchService);
    });
  });
  var scope, element;

  beforeEach(inject(function ($rootScope, $compile, $injector) {
    scope = $rootScope.$new();
    // create empty object to destroy
    scope.omnibox = {
      searchResults: {}
    };
    MapService = $injector.get('MapService');
    State = $injector.get('State');

    element = angular.element('<search></search>');
    $compile(element)(scope);
    var el = angular.element('<div></div>');
    MapService.initializeMap(el[0], {});
    scope.$digest();

  }));

  it('should build query from input field', function () {
    scope.query = "Amsterdam";
    scope.$digest();
    expect(element[0].querySelector('#searchboxinput').value).toBe("Amsterdam");
  });

  it('should clean the input field', function () {
    scope.cleanInput();
    scope.$digest();
    expect(element[0].querySelector('#searchboxinput').value).toBe("");
  });

  it('should not remove assets only search results from box when calling cleanInput', function () {
    scope.omnibox.searchResults = {harry: 'bertenernie'};
    State.assets = ['gemaalomdehoe$666'];
    scope.cleanInput();
    expect(State.assets.length).toEqual(1);
    expect(scope.omnibox.searchResults.harry).toBeUndefined();
  });

  it(
    'should throw error when response status other than ZERO_RESULTS or OK',
    function () {
      scope.query = 'test';
      // Mocked CabinetService will respond whith status 'OVER_QUERY_LIMIT'
      expect(scope.search).toThrow();
    }
  );

});


describe('Directives: Search with real LocationService', function () {
  var MapService, State;

  // load the service's module
  beforeEach(module('lizard-nxt'));
  beforeEach(module('global-state'));

  var scope, element;

  beforeEach(inject(function ($rootScope, $compile, $injector) {
    scope = $rootScope;
    MapService = $injector.get('MapService');
    State = $injector.get('State');

    element = angular.element('<search></search>');
    scope.omnibox = {};
    $compile(element)(scope);
    var el = angular.element('<div></div>');
    MapService.initializeMap(el[0], {});
    scope.$digest();
    // create empty object to destroy

    State = $injector.get('State');

    State.spatial = {
      here: {},
      bounds : {
        getNorth: function () {},
        getSouth: function () {},
        getWest: function () {},
        getEast: function () {},
      }
    };

  }));

  it('should set moment on scope when queried with time', function () {
    scope.query = '23-10-2014';
    scope.search();
    expect(moment.isMoment(scope.omnibox.searchResults.temporal)).toBe(true);
  });

  it(
    'should not set moment on scope when queried with far future',
    function () {
      scope.query = moment().year(moment().year() + 1).toISOString();
      scope.search();
      expect(scope.omnibox.searchResults.temporal).not.toBeDefined();
    }
  );

  it('should zoom to temporal result', function () {
    scope.query = '2014-10-23';
    scope.search();
    var m = scope.omnibox.searchResults.temporal;
    scope.zoomToTemporalResult(m);
    expect(State.temporal.start).toBe(m.valueOf());
    expect(State.temporal.end).toBe(m.valueOf() + m.nxtInterval.valueOf());
  });


  it('should prefer temporal results when hitting enter', function () {
    var ENTER = 13;

    var e = $.Event('keydown');
    e.which = ENTER;

    scope.omnibox.searchResults = {
      temporal: window.moment(),

      spatial: [
        "Novemberstraat 201, 1335 GD Almere, Nederland"
      ]
    };

    spyOn(scope, 'zoomToTemporalResult'); // pure magic, makes haveBeenCalled
                                          // work.

    element.find('#searchboxinput').triggerHandler(e);
    expect(scope.zoomToTemporalResult).toHaveBeenCalled();
  });

});
