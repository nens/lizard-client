'use strict';

describe('Service: SearchService', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate service
  var SearchService,
      State,
      ggResult = {
        'results' : [
          {
            'formatted_address' : '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
            'geometry' : {
              'location' : {
                'lat' : 37.4224764,
                'lng' : -122.0842499
              },
              'location_type' : 'ROOFTOP',
              'viewport' : {
                'northeast' : {
                  'lat' : 37.4238253802915,
                  'lng' : -122.0829009197085
                },
                'southwest' : {
                  'lat' : 37.4211274197085,
                  'lng' : -122.0855988802915
                }
              }
            }
          }
        ],
        'status' : 'OK'
      },
      endpointResult = {
          results: [
          {
            location: {
              object: {
                type: 'measuringstation',
                id: 53,
                geometry: {
                  type: 'Point',
                  coordinates: [
                    4.749649268530605,
                    52.9989098864558,
                    0
                  ]
                },
              },
            },
            search_result_type: 'timeseries'  // jshint ignore:line
          },
          {
            name: 'TexelTestTestTestTest Maximale waterdiepte',
            layers: [
            {
              slug: 'texeltesttesttesttest-maximale-waterdiepte',
              type: 'Raster',
              format: 'Store',
              url: '/api/v2/raster-aggregates',
              tiled: true,
              rescalable: false,
              scale: 'ratio',
              quantity: 'Waterhoogte',
              unit: 'mNAP',
              options: {
                styles: 'Blues:0.0:2.0'
              },
              color: '',
              meta: {
                spatial_bounds: { // jshint ignore:line
                    west: 4.703263588777599,
                    east: 4.903438504805467,
                    north: 53.186603673467665,
                    south: 52.99573210580159
                  }
              }
            },
            {
              slug: 'scenarios:115:maxwdepth',
              type: 'Raster',
              format: 'WMS',
              url: 'http://10.0.3.10:4999/wms',
              tiled: true,
              rescalable: false,
              scale: 'ratio',
              quantity: 'Waterhoogte',
              unit: 'mNAP',
              options: {
                styles: 'Blues:0.0:2.0'
              },
              color: '#FFFFFF',
            }
            ],
            search_result_type: 'layergroup' // jshint ignore:line
          },
          ]
        };

  beforeEach(inject(function ($injector) {
    SearchService = $injector.get('SearchService');
    State = $injector.get('State');

    State.spatial = {
      here: {},
      bounds : {
        getNorth: function () {},
        getSouth: function () {},
        getWest: function () {},
        getEast: function () {},
      }
    };
  }));

  it('should return an object with a CabinetService promise ', function () {
    var result = SearchService.search('testQuery', State);
    expect(!!result.spatial.then).toBe(true);
  });

  it('should contain the google geocoder statuses', function () {
    expect(SearchService.responseStatus.OK).toBe('OK');
  });

  it('should set bounds of search result on State', function () {
    SearchService.zoomToGoogleGeocoderResult(ggResult.results[0], State);
    expect(State.spatial.bounds._southWest.lat)
      .toBe(ggResult.results[0].geometry.viewport.southwest.lat);
  });

  it('should set spatial.here when location_type is ROOFTOP', function () {
    SearchService.zoomToGoogleGeocoderResult(ggResult.results[0], State);
    expect(State.spatial.here.lat)
      .toBe(ggResult.results[0].geometry.location.lat);
  });

  it('should filter the results to the search_result_type', function () {
    var filtered = SearchService.filter(endpointResult.results, 'timeseries');
    expect(filtered.length).toBe(1);
    filtered = SearchService.filter(endpointResult.results, 'layergroup');
    expect(filtered.length).toBe(1);
  });

  it('should instantiate a layer group', function () {
    var layergroupResult = endpointResult.results[1];
    SearchService.openLayerGroup(layergroupResult);
    expect(layergroupResult.hasOwnProperty('lg')).toBe(true);
  });

  it('should set bounds based on layer', function () {
    var layergroupResult = endpointResult.results[1];
    SearchService.openLayerGroup(layergroupResult);
    expect(layergroupResult.lg.spatialBounds.south)
      .toBe(layergroupResult.layers[0].meta.spatial_bounds.south); // jshint ignore:line
  });

  it('should simulate click on timeseries search result', function () {
    var newState = SearchService.zoomToResult(endpointResult.results[0], State);
    expect(newState.spatial.here.lat)
      .toEqual(endpointResult.results[0].location.object.geometry.coordinates[1]);
  });
});
