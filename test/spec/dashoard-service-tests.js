'use strict';

describe('testing dashboard', function () {

  var DashboardService;

  beforeEach(function () {
    module('lizard-nxt');
    module('dashboard');
  });

  beforeEach(inject(function ($injector) {
    DashboardService = $injector.get('DashboardService');
  }));

  it('should filter empty and not updated graphs', function () {

    var graphs = [
      { content: [{updated: false}] },
      { content: [{updated: false}] }
    ];

    expect(DashboardService._filterActiveGraphs).toBeDefined();
    expect(DashboardService._filterActiveGraphs(graphs)).toEqual([]);

  });


  it('should keep non-empty and updated graphs', function () {

    var updatedGraph = { content: [{updated: true}, {updated: false}] };

    var graphs = [
      updatedGraph,
      { content: [{updated: false}] }
    ];

    expect(DashboardService._filterActiveGraphs).toBeDefined();
    expect(DashboardService._filterActiveGraphs(graphs))
    .toEqual([updatedGraph]);

  });

  it('should set all updated of content to false', function () {

    var updatedGraph = { content: [{updated: true}, {updated: false}] };

    var graphs = [
      updatedGraph,
      { content: [{updated: false}] }
    ];

    var resetted = DashboardService._setAllContentToNotUpdated(graphs);

    expect(resetted[0].content[0].updated).toBe(false);

  });

});
