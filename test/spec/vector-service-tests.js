describe('Testing VectorService', function () {
  var $scope, $rootScope, VectorService, LeafletService, options;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    VectorService = $injector.get('VectorService');
    LeafletService = $injector.get('LeafletService');
    options = {uuid: 'sdf'};
  }));

  var geoJson = [
    {
      "id": 1,
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [4.000, 50.000]
      },
      "properties": {
        "category": "peil laag laag (comp.1)",
        "value": "807361",
        "timestamp_start": 10,
        "timestamp_end": 15,
        "event_series": 3,
        "object": {
          "type": "pumpstation",
          "id": 20,
          "geometry": {
            "type": "Point",
            "coordinates": [
              4.968422675147932,
              52.50403545777337
            ]
          },
          "created": 1383815706774
        }
      }
    },
    {
      "id": 2,
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [4.000, 50.000]
      },
      "properties": {
        "category": "PUTDEKSELWEG",
        "value": "Rioolverstopping",
        "timestamp_start": 20,
        "timestamp_end": 25,
        "event_series": 4,
        "object": null
      }
    },
    {
      "id": 3,
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [5.000, 40.000]
      },
      "properties": {
        "category": "PUTDEKSELWEG",
        "value": "Rioolverstopping",
        "timestamp_start": 10,
        "timestamp_end": 15,
        "event_series": 4,
        "object": null
      }
    }
  ];

  it('should set and get data', function () {
    VectorService.setData(options.uuid, geoJson, 4);
    VectorService.getData(options)
      .then(function (gotthis) {
        expect(gotthis[0].id).toBe(geoJson[0].id);
      });
    $rootScope.$digest();
  });

  it('should get all data on AND after the start date', function () {
    VectorService.setData(options.uuid, geoJson, 4);
    options.start = 20
    VectorService.getData(options)
      .then(function (gotthis) {
        expect(gotthis.length).toBe(1);
        expect(gotthis[0].id).toBe(geoJson[1].id);
      });
    $rootScope.$digest();
  });

  it('should get data of latLng', function () {
    VectorService.setData(options.uuid, geoJson);
    options.geom = {type: 'Point', coordinates: [4.000, 50.000]}
    VectorService.getData(options)
      .then(function (gotthis) {
        expect(gotthis.length).toBe(2);
      });
    $rootScope.$digest();
  });

  it('should get data within spatial and temporal extent', function () {
    VectorService.setData(options.uuid, geoJson);
    options.geom = {type: 'Point', coordinates: [4.000, 50.000]}
    options.start = 20
    VectorService.getData(options)
      .then(function (gotthis) {
        expect(gotthis.length).toBe(1);
      });
    $rootScope.$digest();
  });

  it('should get data within spatial extent and for the related object',
    function () {
      VectorService.setData(options.uuid, geoJson);
      options.geom = {type: 'Point', coordinates: [4.000, 50.000]}
      options.object = {
        id: 20,
        type: 'pumpstation'
      };
      VectorService.getData(options).then(function (gotthis) {
          expect(gotthis[0].id).toBe(1); // Because it is related to the object.
          expect(gotthis[1].id).toBe(2); // Because it matches the specified
                                         // geom.
        });
      $rootScope.$digest();
    }
  );

});
