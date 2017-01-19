'use strict;'
// mocks.js


// App is run with debugInfoEnabled(false), because it is faster. But it is
// needed to do stuff like var scope = element.scope();
angular.module('lizard-nxt')
.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(true);
}]);

// Redefine bootstrap module, it is skipped for testing.
angular.module('lizard-bootstrap', []);

angular.module('lizard-nxt')

.value('user', {
  'username': 'henkie.test',
  'first_name': 'Henkie',
  'authenticated': true
})

.value('version', '2.2.7-131-ge220c75')

.value('debug', false);

var rasterMock = [
  [
    0.008306188974529505,
    13.00100040435791
  ],
  [
    0.030466582160443068,
    13.00100040435791
  ],
  [
    0.05262697534635663,
    13.00100040435791
  ],
  [
    0.0747873685322702,
    13.00100040435791
  ]
];

angular.module('lizard-nxt')
  .constant('geoJsonMock', {
  type: 'FeatureCollection',
    features: [
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: 'Feature',
      properties: {
        category: 'STANKOVERLAST',
        object_id: null,
        timestamp_start: 1389902400000,
        value: 'Rioolverstopping',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389909600000,
        id: 3504
      }
    },
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: 'Feature',
      properties: {
        category: 'STANKOVERLAST',
        object_id: null,
        timestamp_start: 1389798000000,
        value: 'Rioolverstopping',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389823200000,
        id: 3503
      }
    },
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.944908089363328,
        52.494730987484054
          ]
      },
      type: 'Feature',
      properties: {
        category: 'STANKOVERLAST',
        object_id: null,
        timestamp_start: 1389729600000,
        value: 'Rioolverstopping',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389736800000,
        id: 3502
      }
    },
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.944908089363328,
        52.494730987484054
          ]
      },
      type: 'Feature',
      properties: {
        category: 'STANKOVERLAST',
        object_id: null,
        timestamp_start: 1389650100000,
        value: 'Rioolverstopping',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389650400000,
        id: 3501
      }
    },
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.944908089363328,
        52.494730987484054
          ]
      },
      type: 'Feature',
      properties: {
        category: 'RIOOLVERSTOPPING',
        object_id: null,
        timestamp_start: 1389650100000,
        value: 'Rioolverstopping',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389650400000,
        id: 3501
      }
    }
  ]
})

angular.module('lizard-nxt')
  .constant('eventMock', {
  type: 'FeatureCollection',
    features: [
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: 'Feature',
      properties: {
        category: 'STANKOVERLAST',
        object_id: null,
        timestamp_start: 1389729600000,
        value: '2',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389909600000,
        id: 3504
      }
    },
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: 'Feature',
      properties: {
        category: 'STANKOVERLAST',
        object_id: null,
        timestamp_start: 1389729600000,
        value: '3',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389823200000,
        id: 3503
      }
    },
    {
      geometry: {
        type: 'Point',
        coordinates: [
          4.944908089363328,
        52.494730987484054
          ]
      },
      type: 'Feature',
      properties: {
        category: 'STANKOVERLAST',
        object_id: null,
        timestamp_start: 1389729600000,
        value: '4',
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389736800000,
        id: 3502
      }
    }
  ]
});
