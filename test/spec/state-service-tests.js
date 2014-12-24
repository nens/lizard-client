'use strict';


describe('Testing State service', function () {
  var State;

  beforeEach(module('global-state'));
  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    State = $injector.get('State');
  }));

  it('should contain global state spatial, temporal, box, layergroups and ' +
    ' context', function () {
    expect(State.spatial).toBeDefined();
    expect(State.temporal).toBeDefined();
    expect(State.box).toBeDefined();
    expect(State.layerGroups).toBeDefined();
    expect(State.context).toBeDefined();
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