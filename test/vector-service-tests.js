describe('Testing VectorService', function () {
  var $scope, $rootScope, VectorService, LeafletService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    VectorService = $injector.get('VectorService');
    LeafletService = $injector.get('LeafletService');
  }));

  var geoJson = [{"id": 2844, "type": "Feature", "geometry": {"type": "Point", "coordinates": [5.209040423727382, 52.36544191276044]}, "properties": {"category": "peil laag laag (comp.1)", "value": "807361", "timestamp_start": 1389988800000, "timestamp_end": 1389996000000, "event_series": 3, "object": null}}, {"id": 3505, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.986668114895552, 52.50079113117614]}, "properties": {"category": "PUTDEKSELWEG", "value": "Rioolverstopping", "timestamp_start": 1358460000000, "timestamp_end": 1389996000000, "event_series": 4, "object": null}}, {"id": 3504, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.954955496434113, 52.501379130617515]}, "properties": {"category": "STANKOVERLAST", "value": "Rioolverstopping", "timestamp_start": 1389902400000, "timestamp_end": 1389909600000, "event_series": 4, "object": null}}, {"id": 2843, "type": "Feature", "geometry": {"type": "Point", "coordinates": [5.177320276863634, 52.394941104263815]}, "properties": {"category": "inschakelpeil en geen water in comp.1", "value": "807379", "timestamp_start": 1389909600000, "timestamp_end": 1389909600000, "event_series": 3, "object": null}}, {"id": 3503, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.954955496434113, 52.501379130617515]}, "properties": {"category": "STANKOVERLAST", "value": "Rioolverstopping", "timestamp_start": 1389798000000, "timestamp_end": 1389823200000, "event_series": 4, "object": null}}, {"id": 2842, "type": "Feature", "geometry": {"type": "Point", "coordinates": [5.177320276863634, 52.394941104263815]}, "properties": {"category": "inschakelpeil en geen water in comp.1", "value": "807381", "timestamp_start": 1389391200000, "timestamp_end": 1389823200000, "event_series": 3, "object": null}}, {"id": 2841, "type": "Feature", "geometry": {"type": "Point", "coordinates": [5.177320276863634, 52.394941104263815]}, "properties": {"category": "inschakelpeil en geen water in comp.1", "value": "807383", "timestamp_start": 1389564000000, "timestamp_end": 1389736800000, "event_series": 3, "object": null}}, {"id": 3502, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.932342227677087, 52.494855820440186]}, "properties": {"category": "STANKOVERLAST", "value": "Rioolverstopping", "timestamp_start": 1389729600000, "timestamp_end": 1389736800000, "event_series": 4, "object": null}}, {"id": 2840, "type": "Feature", "geometry": {"type": "Point", "coordinates": [5.209040423727382, 52.36544191276044]}, "properties": {"category": "peil hoog (comp.1)", "value": "807393", "timestamp_start": 1389649200000, "timestamp_end": 1389650400000, "event_series": 3, "object": null}}, {"id": 3501, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.944908089363328, 52.494730987484054]}, "properties": {"category": "STANKOVERLAST", "value": "Rioolverstopping", "timestamp_start": 1389650100000, "timestamp_end": 1389650400000, "event_series": 4, "object": null}}];

  it('should set data', function () {
    VectorService.setData('events', geoJson);
    var gotthis = VectorService.getData('events', geoJson);
    expect(gotthis).toEqual(geoJson);
  });

  it('should get all data', function () {
    VectorService.setData('events', geoJson);
    var gotthis = VectorService.getData('events');
    expect(gotthis).toEqual(geoJson);
  });

  it('should get data after date', function () {
    VectorService.setData('events', geoJson);
    var gotthis = VectorService.getData('events', {start: 1389988800000});
    expect(gotthis).toEqual([geoJson[0]]);
  });

  it('should get data before date', function () {
    VectorService.setData('events', geoJson);
    var gotthis = VectorService.getData('events', {end: 1389650400000});
    expect(gotthis).toEqual(geoJson.slice(geoJson.length - 2, geoJson.length));
  });

  it('should get data between date', function () {
    VectorService.setData('events', geoJson);
    var gotthis = VectorService.getData('events', {start: 1389650000000, end: 1389650400000});
    expect(gotthis).toEqual(geoJson.slice(geoJson.length - 1, geoJson.length));
  });

  it('should get data within bounds', function () {
    VectorService.setData('events', geoJson);
    var bounds = new LeafletService.LatLngBounds(
      new LeafletService.LatLng(4.94, 52.3),
      new LeafletService.LatLng(4.96, 52.5)
      );
    var gotthis = VectorService.getData('events', bounds);
    expect(gotthis).toEqual(geoJson.slice(geoJson.length - 1, geoJson.length));
  });

  it('should get data within spatial and temporal extent', function () {
    VectorService.setData('events', geoJson);
    var bounds = new LeafletService.LatLngBounds(
      new LeafletService.LatLng(4.93, 52.3),
      new LeafletService.LatLng(4.96, 52.5)
      );
    var gotthis = VectorService.getData('events', bounds, {
      start: 1389650100000,
      end: 1389736800000
    });
    expect(gotthis).toEqual([geoJson[geoJson.length - 3], geoJson[geoJson.length - 1]]);
  });

  it('should append data if zoomlevel is the same', function () {
    VectorService.setData('events', geoJson, 2);
    VectorService.setData('events', ['henkie'], 2);

    var gotthis = VectorService.getData('events');
    var shouldbethis = [];
    Array.prototype.push.apply(shouldbethis, geoJson);
    Array.prototype.push.apply(shouldbethis, ['henkie']);
    expect(gotthis).toEqual(shouldbethis);
  })

});