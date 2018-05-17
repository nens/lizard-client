'use strict';

describe('Service: SearchService', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  // instantiate service
  var SearchService,
      State,
      ggResult = {
        "type": "FeatureCollection",
        "query": [
          "los",
          "angeles"
        ],
        "features": [
          {
            "id": "place.9962989141465270",
            "type": "Feature",
            "place_type": [
              "place"
            ],
            "relevance": 0.99,
            "properties": {
              "wikidata": "Q65"
            },
            "text": "Los Angeles",
            "place_name": "Los Angeles, California, United States",
            "bbox": [
              -118.529221009603,
              33.901599990108,
              -118.121099990025,
              34.1612200099034
            ],
            "center": [
              -118.2439,
              34.0544
            ],
            "geometry": {
              "type": "Point",
              "coordinates": [
                -118.2439,
                34.0544
              ]
            },
            "context": [
              {
                "id": "region.3591",
                "short_code": "US-CA",
                "wikidata": "Q99",
                "text": "California"
              },
              {
                "id": "country.3145",
                "short_code": "us",
                "wikidata": "Q30",
                "text": "United States"
              }
            ]
          }
        ],
        "attribution": "NOTICE."
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
            entity_url: "/api/v3/groundwaterstations/4/",
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
            entity_url: "/api/v3/groundwaterstations/5/",
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

  it('should set bounds of search result on State', function () {
    SearchService.zoomToGoogleGeocoderResult(ggResult.features[0], State);
    expect(State.spatial.bounds._southWest.lat)
      .toBe(ggResult.features[0].bbox[1]);
  });

});
