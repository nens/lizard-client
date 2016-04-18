'use strict';

describe('Favourites', function () {
  var State, FavService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    FavService = $injector.get('FavouritesService');
    State = $injector.get('State');
  }));

  it('should restore relatvie time', function () {
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

    // Divide by ten to use ToBeCloseTo to give js 10 ms to execute
    // FavService.applyFavourite.
    var favStart = (favourite.state.temporal.start + tenHours) / 10;
    var favEnd = (favourite.state.temporal.end + tenHours) / 10;
    var favAt = (favourite.state.temporal.at + tenHours) / 10;

    expect(State.temporal.start / 10).toBeCloseTo(favStart, 1);
    expect(State.temporal.end / 10).toBeCloseTo(favEnd, 1);
    expect(State.temporal.at / 10).toBeCloseTo(favAt, 1);
  });

});
