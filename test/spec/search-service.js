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
    expect(result.spatial.hasOwnProperty('then')).toBe(true);
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

});
