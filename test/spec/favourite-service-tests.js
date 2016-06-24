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

    FavService.applyFavourite(angular.copy(favourite.state));

    // Divide by 100 to use ToBeCloseTo to give js 100 ms to execute
    // FavService.applyFavourite.
    var favStart = (favourite.state.temporal.start + tenHours) / 100;
    var favEnd = (favourite.state.temporal.end + tenHours) / 100;
    var favAt = (favourite.state.temporal.at + tenHours) / 100;

    expect(State.temporal.start / 100).toBeCloseTo(favStart, 1);
    expect(State.temporal.end / 100).toBeCloseTo(favEnd, 1);
    expect(State.temporal.at / 100).toBeCloseTo(favAt, 1);
  });

});
