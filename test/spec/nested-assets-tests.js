'use strict';

describe('Nested assets', function () {
  var getNestedAssets;
  var nestedAssets;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {

    getNestedAssets = $injector.get('getNestedAssets');
    // Create asset with nested monitoring_wells as coming fomr api.
    var asset = {
      'id': 2,
      'monitoring_wells': [
        {
          'id': 7,
        },
        {
          'id': 6,
        }
      ],
      'name': 'test2',
    };

    nestedAssets = getNestedAssets(asset);

  }));

  it('should return all monitoring wells of parent asset', function () {
    expect(nestedAssets.length).toBe(2);
    expect(nestedAssets[0].id).toBe(7);
  });

  it('should return nested assets with entity_names', function () {
    expect(nestedAssets[0].entity_name).toBe('monitoringwell');
  });

});
