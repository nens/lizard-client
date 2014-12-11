// mocks.js

// Contains data_layers as coming from the server, and a nxtMap object
// that can be used as a mapState.

angular.module('lizard-nxt')
  .controller('DummyCtrl', ['$scope', function ($scope) {
  $scope.dummy = {};
}]);

window.JS_DEBUG = false;

// bootstrapped stuff by Django does not exist in tests.
window.data_layers = {
  "satellite": {
    "name": "Satelliet", 
    "slug": "satellite", 
    "active": false, 
    "temporal": false, 
    "temporal_resolution": 0, 
    "opacity": 1.0, 
    "order": 0, 
    "baselayer": true, 
    "layers": [
    {
      "slug": "nelenschuurmans.iaa79205", 
      "type": "Raster", 
      "format": "TMS", 
      "min_zoom": 0, 
      "max_zoom": 31, 
      "z_index": 0, 
      "url": "http://{s}.tiles.mapbox.com/v3", 
      "tiled": true, 
      "rescalable": false, 
      "scale": "nominal", 
      "quantity": null, 
      "unit": null, 
      "aggregation_type": "none", 
      "load_order": null, 
      "options": {}, 
      "bounds": {}, 
      "color": "", 
      "event_count": 0
    }
    ]
  }, 
  "topography": {
    "name": "Topografie", 
    "slug": "topography", 
    "active": true, 
    "temporal": false, 
    "temporal_resolution": 0, 
    "opacity": 1.0, 
    "order": 1, 
    "baselayer": true, 
    "layers": [
    {
      "slug": "nelenschuurmans.iaa98k8k", 
      "type": "Raster", 
      "format": "TMS", 
      "min_zoom": 0, 
      "max_zoom": 31, 
      "z_index": 0, 
      "url": "http://{s}.tiles.mapbox.com/v3", 
      "tiled": true, 
      "rescalable": false, 
      "scale": "nominal", 
      "quantity": null, 
      "unit": null, 
      "aggregation_type": "none", 
      "load_order": null, 
      "options": {}, 
      "bounds": {}, 
      "color": "", 
      "event_count": 0
    }
    ]
  }, 
  "elevation": {
    "name": "Hoogtekaart", 
    "slug": "elevation", 
    "active": false, 
    "temporal": false, 
    "temporal_resolution": 0, 
    "opacity": 1.0, 
    "order": 2, 
    "baselayer": false, 
    "layers": [
    {
      "slug": "dem:nl", 
      "type": "Raster", 
      "format": "WMS", 
      "min_zoom": 0, 
      "max_zoom": 31, 
      "z_index": 1, 
      "url": "https://raster.lizard.net/wms", 
      "tiled": true, 
      "rescalable": true, 
      "scale": "nominal", 
      "quantity": null, 
      "unit": null, 
      "aggregation_type": "curve", 
      "load_order": null, 
      "options": {
        "styles": "BrBG_r", 
        "effects": "shade:0:3"
      }, 
      "bounds": {}, 
      "color": "", 
      "event_count": 0
    }, 
    {
      "slug": "dem/nl", 
      "type": "Raster", 
      "format": "Store", 
      "min_zoom": 0, 
      "max_zoom": 31, 
      "z_index": 0, 
      "url": "/api/v1/rasters", 
      "tiled": true, 
      "rescalable": false, 
      "scale": "interval", 
      "quantity": "Hoogte", 
      "unit": "m NAP", 
      "aggregation_type": "curve", 
      "load_order": null, 
      "options": {}, 
      "bounds": {}, 
      "color": "", 
      "event_count": 0
    }
    ]
  }, 
  "waterchain": {
    "name": "Water", 
    "slug": "waterchain", 
    "active": true, 
    "temporal": false, 
    "temporal_resolution": 0, 
    "opacity": 1.0, 
    "order": 5, 
    "baselayer": false, 
    "layers": [
    {
      "slug": "waterchain_png", 
      "type": "Asset", 
      "format": "TMS", 
      "min_zoom": 7, 
      "max_zoom": 31, 
      "z_index": 3, 
      "url": "/api/v1/tiles", 
      "tiled": true, 
      "rescalable": false, 
      "scale": "nominal", 
      "quantity": null, 
      "unit": null, 
      "aggregation_type": "none", 
      "load_order": 100, 
      "options": {}, 
      "bounds": {}, 
      "color": "", 
      "event_count": 0
    }, 
    {
      "slug": "waterchain_grid", 
      "type": "Asset", 
      "format": "UTFGrid", 
      "min_zoom": 7, 
      "max_zoom": 31, 
      "z_index": 4, 
      "url": "/api/v1/tiles", 
      "tiled": true, 
      "rescalable": false, 
      "scale": "nominal", 
      "quantity": null, 
      "unit": null, 
      "aggregation_type": "none", 
      "load_order": null, 
      "options": {}, 
      "bounds": {}, 
      "color": "", 
      "event_count": 0
    }
    ]
  }, 
  "soil": {
    "name": "Bodem", 
    "slug": "soil", 
    "active": false, 
    "temporal": false, 
    "temporal_resolution": 0, 
    "opacity": 1.0, 
    "order": 4, 
    "baselayer": false, 
    "layers": [
    {
      "slug": "isahw:BOFEK2012", 
      "type": "Raster", 
      "format": "WMS", 
      "min_zoom": 0, 
      "max_zoom": 31, 
      "z_index": 0, 
      "url": "http://geoserver6.lizard.net/geoserver/isahw/wms", 
      "tiled": true, 
      "rescalable": false, 
      "scale": "nominal", 
      "quantity": null, 
      "unit": null, 
      "aggregation_type": "none", 
      "load_order": null, 
      "options": {
        "styles": "", 
        "transparent": "true", 
        "tiled": "true"
      }, 
      "bounds": {}, 
      "color": "", 
      "event_count": 0
    }
    ]
  }, 
  "alarm": {
    "name": "Alarm", 
    "slug": "alarm", 
    "active": false, 
    "temporal": false, 
    "temporal_resolution": 0, 
    "opacity": 1.0, 
    "order": 7, 
    "baselayer": false, 
    "layers": [
    {
      "slug": "alarm", 
      "type": "Event", 
      "format": "Vector", 
      "min_zoom": 11, 
      "max_zoom": 31, 
      "z_index": null, 
      "url": "/api/v1/tiles", 
      "tiled": true, 
      "rescalable": false, 
      "scale": "nominal", 
      "quantity": "", 
      "unit": "", 
      "aggregation_type": "none", 
      "load_order": null, 
      "options": {}, 
      "bounds": {}, 
      "color": "#c0392b", 
      "event_count": 6
    }
    ]
  } 
};



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
  type: "FeatureCollection",
    features: [
    {
      geometry: {
        type: "Point",
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: "Feature",
      properties: {
        category: "STANKOVERLAST",
        object_id: null,
        timestamp_start: 1389902400000,
        value: "Rioolverstopping",
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389909600000,
        id: 3504
      }
    },
    {
      geometry: {
        type: "Point",
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: "Feature",
      properties: {
        category: "STANKOVERLAST",
        object_id: null,
        timestamp_start: 1389798000000,
        value: "Rioolverstopping",
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389823200000,
        id: 3503
      }
    },
    {
      geometry: {
        type: "Point",
        coordinates: [
          4.944908089363328,
        52.494730987484054
          ]
      },
      type: "Feature",
      properties: {
        category: "STANKOVERLAST",
        object_id: null,
        timestamp_start: 1389729600000,
        value: "Rioolverstopping",
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389736800000,
        id: 3502
      }
    },
    {
      geometry: {
        type: "Point",
        coordinates: [
          4.944908089363328,
        52.494730987484054
          ]
      },
      type: "Feature",
      properties: {
        category: "STANKOVERLAST",
        object_id: null,
        timestamp_start: 1389650100000,
        value: "Rioolverstopping",
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
  type: "FeatureCollection",
    features: [
    {
      geometry: {
        type: "Point",
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: "Feature",
      properties: {
        category: "STANKOVERLAST",
        object_id: null,
        timestamp_start: 1389729600000,
        value: "2",
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389909600000,
        id: 3504
      }
    },
    {
      geometry: {
        type: "Point",
        coordinates: [
          4.954955496434113,
        52.50137913061751
          ]
      },
      type: "Feature",
      properties: {
        category: "STANKOVERLAST",
        object_id: null,
        timestamp_start: 1389729600000,
        value: "3",
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389823200000,
        id: 3503
      }
    },
    {
      geometry: {
        type: "Point",
        coordinates: [
          4.944908089363328,
        52.494730987484054
          ]
      },
      type: "Feature",
      properties: {
        category: "STANKOVERLAST",
        object_id: null,
        timestamp_start: 1389729600000,
        value: "4",
        object_type_id: null,
        event_series_id: 4,
        timestamp_end: 1389736800000,
        id: 3502
      }
    }
  ]
});
