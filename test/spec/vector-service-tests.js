describe('Testing VectorService', function () {
  var $scope, $rootScope, VectorService, LeafletService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    VectorService = $injector.get('VectorService');
    LeafletService = $injector.get('LeafletService');
  }));

  var geoJson = [
    {
      "id": 2844,
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [5.209040423727382, 52.36544191276044]
      },
      "properties": {
        "category": "peil laag laag (comp.1)",
        "value": "807361",
        "timestamp_start": 1389988800000,
        "timestamp_end": 1389996000000,
        "event_series": 3,
        "object": null
      }
    },
    {
      "id": 3505,
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [4.986668114895552, 52.50079113117614]
      },
      "properties": {
        "category": "PUTDEKSELWEG",
        "value": "Rioolverstopping",
        "timestamp_start": 1358460000000,
        "timestamp_end": 1389996000000,
        "event_series": 4,
        "object": null
      }
    }
  ];

  var nonLeaflayer = {
    _leafletLayer: {
      isLoading: false
    },
    slug: 'events'
  };

  it('should set and get data', function () {
    VectorService.setData(nonLeaflayer.slug, geoJson, 4);
    VectorService.getData(nonLeaflayer, {})
      .then(function (gotthis) {
        expect(gotthis[0].id).toBe(geoJson[0].id);
      });
    $rootScope.$digest();
  });

  it('should get all data that is happening on AND after the start date', function () {
    VectorService.setData('events', geoJson, 4);
    VectorService.getData(nonLeaflayer, {start: 1358470000000})
      .then(function (gotthis) {
        expect(gotthis.length).toBe(2);
      });
    $rootScope.$digest();
  });

  it('should get data of latLng', function () {
    VectorService.setData('events', geoJson);
    var latLng = new LeafletService.LatLng(52.36544191276044,5.209040423727382);
    VectorService.getData(nonLeaflayer, {geom: latLng})
      .then(function (gotthis) {
        expect(gotthis[0].id).toBe(2844);
      });
    $rootScope.$digest();
  });

  it('should get data within spatial and temporal extent', function () {
    VectorService.setData('events', geoJson);
    var latLng = new LeafletService.LatLng(52.36544191276044,5.209040423727382);
    VectorService.getData(nonLeaflayer, {geom: latLng, start: 0})
      .then(function (gotthis) {
        expect(gotthis.length).toBe(0);
      });
    $rootScope.$digest();
  });

});
