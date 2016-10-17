'use strict';

describe('Testing annotations layer', function () {
  var DataService, MapService;

  beforeEach(module('lizard-nxt'));
  beforeEach(module('data-menu'));

  beforeEach(inject(function ($injector, $compile) {
    DataService = $injector.get('DataService');
    MapService = $injector.get('MapService');
    var $rootScope = $injector.get('$rootScope');
    var State = $injector.get('State');

    // Leaflet's map.hasLayer is called when adding annotations.
    var mapScope = $rootScope.$new();
    mapScope.state = State;
    var mapElement = angular.element('<map state="state"></map>');
    $compile(mapElement)(mapScope);

    $compile('<annotations-layer></annotations-layer>')($rootScope);
    $rootScope.$digest();
  }));

  it('should add an annotations eventseries datalayer', function () {
    var uuid = 'annotations';
    var annotationsLayer = DataService.annotationsLayer;
    expect(annotationsLayer.uuid).toBe(uuid);
  });

  it('should add an annotations eventseries maplayer with marker cluster layer',
    function () {
      var annotationsLayer = MapService.annotationsLayer;
      expect(annotationsLayer.cml).toBeDefined();
    }
  );

});
