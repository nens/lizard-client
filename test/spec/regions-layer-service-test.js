'use strict';

describe('Testing NxtRegionsLayer', function () {
  var NxtRegionsLayer,
      MapService;

  beforeEach(module('map'));
  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    NxtRegionsLayer = $injector.get('NxtRegionsLayer');

    MapService = $injector.get('MapService');
    var el = angular.element('<div></div>');
    MapService.initializeMap(el[0], {});
  }));

  var regions = {
    "type": "FeatureCollection",
    "features": [
      {
        "id": "",
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                6.73223393753252,
                52.892182439611666
              ],
              [
                6.73633707130147,
                52.87869128709281
              ],
              [
                6.714563920865843,
                52.86815881513394
              ]
            ]
          ]
        },
        "properties": {
          "name": "Aa en Hunze",
          "type": "MUNICIPALITY"
        }
      },
      {
        "id": "",
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                5.081756603739015,
                51.722289503493954
              ],
              [
                5.071325236745616,
                51.717040767307246
              ]
            ]
          ]
        },
        "properties": {
          "name": "Aalburg",
          "type": "MUNICIPALITY"
        }
      }
    ]
  };

  it('should fire a click on specific region', function () {

    var regionString = 'Aalburg';
    NxtRegionsLayer.setActiveRegion(regionString);

    var clickedRegion = {};

    var cb = function (layer) {
      clickedRegion = layer;
    };

    NxtRegionsLayer.add(regions, cb);

    expect(clickedRegion.feature.properties.name).toBe(regionString);
  });

  it('should not fire a click after re-adding', function () {

    var regionString = 'Aalburg';
    NxtRegionsLayer.setActiveRegion(regionString);

    var clickedRegion;

    var cb = function (layer) {
      clickedRegion = layer;
    };

    NxtRegionsLayer.add(regions, function () {});
    NxtRegionsLayer.remove();
    NxtRegionsLayer.add(regions, cb);

    expect(clickedRegion).not.toBeDefined();
  });

});
