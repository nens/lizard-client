'use strict';


describe('Testing State service', function () {
  var State, UtilService;

  beforeEach(module('global-state'));
  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    State = $injector.get('State');
    UtilService = $injector.get('UtilService');
  }));

  it('should contain global state spatial, temporal, box, layergroups, ' +
    'selected and context', function () {
    expect(State.spatial).toBeDefined();
    expect(State.temporal).toBeDefined();
    expect(State.box).toBeDefined();
    expect(State.layerGroups).toBeDefined();
    expect(State.context).toBeDefined();
    expect(State.selected).toBeDefined();
  });

  it('should set temporal.end to the max when set with a futuristic timestamp',
    function () {
      var theVeryFarFuture = new Date();
      theVeryFarFuture.setYear(3050);
      State.temporal.end = theVeryFarFuture.getTime();
      expect(State.temporal.end).toEqual(UtilService.MAX_TIME);
    }
  );

  it('should keep at within time extent', function () {
    State.temporal.start = 10 * 24 * 60 * 60 * 1000; // 01-1970
    State.temporal.end = 100 * 24 * 60 * 60 * 1000; // later
    expect(State.temporal.at).toBe(UtilService.roundTimestamp(
        State.temporal.end,
        State.temporal.aggWindow,
        true
      ) - State.temporal.aggWindow
    );
  });

  it('should have a box type that can have the value region', function () {
    State.box.type = 'region';
    expect(State.box.type).toBe('region');
  });

  it('should reset the selected field', function () {
    State.selected.assets.push('bogus$1');
    expect(State.selected.assets.length).toBe(1);
    State.selected.reset();
    expect(State.selected.assets.length).toBe(0);
  });

});

describe('Testing State toString', function () {
  var State;

  beforeEach(module('global-state'));
  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    State = $injector.get('State');
  }));

  it('should return a function that returns a string of state attribute',
    function () {
    expect(State.toString('spatial.mapMoving')()).toEqual('false');
  });

  it('should return a function that returns a string of undefined when undefined',
    function () {
    expect(State.toString('spatial.nonexistent.neither')()).not.toBeDefined();
  });

});
