'use strict';

describe('Favourites', function () {
  var State, FavService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    FavService = $injector.get('FavouritesService');
    State = $injector.get('State');
  }));

  it('should restore relative time', function () {
    // Set state to the past
    State.temporal.start = 100000;
    State.temporal.end = 150000;
    State.temporal.at = 130000;

    var tenHours = 36000000;

    // Create favourite with temporal in the past, but relative.
    var favourite = {
      state: {
        temporal: {
          start: 20000,
          end: 26000,
          at: 24000,
          now: Date.now() - tenHours,
          relative: true
        }
      }
    };

    FavService.applyFavourite(angular.copy(favourite));

    // Divide by 100 to use ToBeCloseTo to give js 100 ms to execute
    // FavService.applyFavourite.
    var favStart = (favourite.state.temporal.start + tenHours) / 100;
    var favEnd = (favourite.state.temporal.end + tenHours) / 100;
    var favAt = (favourite.state.temporal.at + tenHours) / 100;

    expect(State.temporal.start / 100).toBeCloseTo(favStart, 1);
    expect(State.temporal.end / 100).toBeCloseTo(favEnd, 1);
    expect(State.temporal.at / 100).toBeCloseTo(favAt, 1);
  });

  it('should replace layers', function () {
    // Create favourite with temporal in the past, but relative.
    var favourite = {
      state: {
        layers: [
          {uuid: 'af434g', active: false, name: 'test2'},
          {uuid: '1sdf32', active: true, name: 'test3'}]
      }
    };

    FavService.applyFavourite(angular.copy(favourite));
    expect(State.layers[0].name).toBe('test2');
    expect(State.layers[0].uuid).toBe('af434g');
    expect(State.layers[1].uuid).toBe('1sdf32');
  });

  it('should replace annotations.active', function () {
    // Create favourite with temporal in the past, but relative.
    var favourite = {
      state: {
        annotations: {active: true}
      }
    };

    FavService.applyFavourite(angular.copy(favourite));

    expect(State.annotations.active).toBe(true);
    expect(State.annotations.present).toBe(false); // Default, state was reset
  });


});


describe('Favourite login', function () {

  var $window, FavService;

  beforeEach(module('lizard-nxt'));

  beforeEach(module(function($provide) {
    $window = {
      location: {host: 'localhost:9000', protocol: 'http'},
    };

    $provide.constant('$window', $window);
  }));

  beforeEach(inject(function ($injector) {
    FavService = $injector.get('FavouritesService');
  }));

  it('should login without favourite on next parameter', function () {
    FavService.logIn();
    expect($window.location).toBe('/accounts/login/?' +
      'domain=http//localhost:8000/&next=http//localhost:9000');
  });

  it('should login with favourite on next parameter', function () {
    FavService.logIn.bind({favourite: 'test'})();
    expect($window.location).toBe('/accounts/login/?' +
     'domain=http//localhost:8000/&next=http//localhost:9000/favourites/test');
  });

});
