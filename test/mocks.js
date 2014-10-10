// mocks.js

// Contains data_layers as coming from the server, and a nxtMap object
// that can be used as a mapState.

window.JS_DEBUG = false;

// bootstrapped stuff by Django does not exist in tests.
var data_layers = {
  "satellite": {
    "layers": [
      {
        "slug": "nelenschuurmans.iaa79205",
        "type": "TMS",
        "min_zoom": 0,
        "max_zoom": 31,
        "z_index": 0,
        "url": "http://{s}.tiles.mapbox.com/v3",
        "tiled": true,
        "temporal": false,
        "aggregation_type": "none",
        "opacity": 1.0
      }
    ],
    "id": 2,
    "name": "Satelliet",
    "slug": "satellite",
    "active": false,
    "order": 2,
    "baselayer": true
  },
  "elevation": {
    "layers": [
      {
        "slug": "ahn2/wss",
        "type": "Store",
        "min_zoom": 0,
        "max_zoom": 31,
        "z_index": 0,
        "url": "/api/v1/rasters",
        "tiled": true,
        "temporal": false,
        "aggregation_type": "curve",
        "opacity": 1.0
      },
      {
        "slug": "elevation",
        "type": "WMS",
        "min_zoom": 0,
        "max_zoom": 31,
        "z_index": 0,
        "url": "http://raster.lizard.net/wms",
        "tiled": true,
        "temporal": false,
        "aggregation_type": "curve",
        "opacity": 1.0
      }
    ],
    "id": 3,
    "name": "Hoogtekaart",
    "slug": "elevation",
    "active": false,
    "order": 1,
    "baselayer": true
  },
  "waterchain": {
    "layers": [
      {
        "slug": "impervioussurface",
        "type": "Vector",
        "min_zoom": 19,
        "max_zoom": 31,
        "z_index": 5,
        "url": "/api/v1/tiles",
        "tiled": true,
        "temporal": false,
        "aggregation_type": "none",
        "opacity": 1.0
      },
      {
        "slug": "waterchain_grid",
        "type": "UTFGrid",
        "min_zoom": 7,
        "max_zoom": 31,
        "z_index": 4,
        "url": "/api/v1/tiles",
        "tiled": true,
        "temporal": false,
        "aggregation_type": "none",
        "opacity": 1.0
      },
      {
        "slug": "waterchain_png",
        "type": "TMS",
        "min_zoom": 7,
        "max_zoom": 31,
        "z_index": 3,
        "url": "/api/v1/tiles",
        "tiled": true,
        "temporal": false,
        "aggregation_type": "none",
        "opacity": 1.0
      }
    ],
    "id": 5,
    "name": "Water",
    "slug": "waterchain",
    "active": true,
    "order": 2,
    "baselayer": false
  },
  "rain": {
    "layers": [
      {
        "slug": "radar/basic",
        "type": "Store",
        "min_zoom": 0,
        "max_zoom": 31,
        "z_index": 2,
        "url": "/api/v1/rasters",
        "tiled": false,
        "temporal": true,
        "aggregation_type": "none",
        "opacity": 1.0
      },
      {
        "slug": "demo:radar",
        "type": "WMS",
        "min_zoom": 0,
        "max_zoom": 31,
        "z_index": 2,
        "url": "http://raster.lizard.net/wms",
        "tiled": false,
        "temporal": true,
        "aggregation_type": "none",
        "opacity": 1.0
      }
    ],
    "id": 6,
    "name": "Regen",
    "slug": "rain",
    "active": false,
    "order": 3,
    "baselayer": false
  },
  "alarms": {
    "layers": [
      {
        "opacity": 1.0,
        "max_zoom": 31,
        "min_zoom": 0,
        "tiled": true,
        "slug": "alarms",
        "z_index": 100,
        "aggregation_type": "none",
        "url": "/api/v1/tiles",
        "temporal": true,
        "summary": 6,
        "type": "Vector"
      }
    ],
    "name": "Alarmen",
    "slug": "alarms",
    "active": false,
    "baselayer": false,
    "order": 5
  }
};

var data_bounds = {
  "all": {
    "west": 3.04,
    "east": 7.58,
    "north": 53.63,
    "south": 50.57
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

