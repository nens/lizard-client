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
            id: 1,
            title: "B19D0303",
            description: "396",
            rank: 1.1,
            entity_name: "groundwaterstation",
            entity_id: 4,
            entity_url: "/api/v2/groundwaterstations/4/",
            view: [
                52.53154,
                4.853579999999999,
                15
            ]
          },
          {
            id: 2,
            title: "B38A1855",
            description: "404",
            rank: 1.1,
            entity_name: "groundwaterstation",
            entity_id: 5,
            entity_url: "/api/v2/groundwaterstations/5/",
            view: [
                51.98899999999999,
                4.65027,
                15
            ]
          }
        ]
      };

  beforeEach(inject(function ($injector) {
    SearchService = $injector.get('SearchService');
    State = $injector.get('State');

    State.spatial = {
      bounds : {
        getNorth: function () {},
        getSouth: function () {},
        getWest: function () {},
        getEast: function () {},
      }
    }
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

  xit('should set first API search result as selected on State', function () {
    SearchService.zoomToSearchResult(endpointResult.results[0], State);
    expect(State.selected.assets.length)
      .toBe(1);
    // Please check here if the selected asset on the State actually
    // corresponds to the search result.
  });
});
