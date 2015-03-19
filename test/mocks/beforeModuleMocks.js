// mocks.js

// Contains data_layers as coming from the server.

window.JS_DEBUG = false;

window.data_layers = {
  'satellite': {
    'name': 'Satelliet',
    'slug': 'satellite',
    'active': false,
    'temporal': false,
    'temporal_resolution': 0,
    'opacity': 1.0,
    'order': 0,
    'baselayer': true,
    'layers': [
    {
      'slug': 'nelenschuurmans.iaa79205',
      'type': 'Raster',
      'format': 'TMS',
      'min_zoom': 0,
      'max_zoom': 31,
      'z_index': 0,
      'url': 'http://{s}.tiles.mapbox.com/v3',
      'tiled': true,
      'rescalable': false,
      'scale': 'nominal',
      'quantity': null,
      'unit': null,
      'aggregation_type': 'none',
      'load_order': null,
      'options': {},
      'bounds': {},
      'color': '',
      'event_count': 0,
      "meta": "no metadata for this layer format."
    }
    ]
  },
  'topography': {
    'name': 'Topografie',
    'slug': 'topography',
    'active': true,
    'temporal': false,
    'temporal_resolution': 0,
    'opacity': 1.0,
    'order': 1,
    'baselayer': true,
    'layers': [
    {
      'slug': 'nelenschuurmans.iaa98k8k',
      'type': 'Raster',
      'format': 'TMS',
      'min_zoom': 0,
      'max_zoom': 31,
      'z_index': 0,
      'url': 'http://{s}.tiles.mapbox.com/v3',
      'tiled': true,
      'rescalable': false,
      'scale': 'nominal',
      'quantity': null,
      'unit': null,
      'aggregation_type': 'none',
      'load_order': null,
      'options': {},
      'bounds': {},
      'color': '',
      'event_count': 0,
      "meta": "no metadata for this layer format."
    }
    ]
  },
  'elevation': {
    'name': 'Hoogtekaart',
    'slug': 'elevation',
    'active': false,
    'temporal': false,
    'temporal_resolution': 0,
    'opacity': 1.0,
    'order': 2,
    'baselayer': false,
    'layers': [
    {
      'slug': 'dem:nl',
      'type': 'Raster',
      'format': 'WMS',
      'min_zoom': 0,
      'max_zoom': 31,
      'z_index': 1,
      'url': 'https://raster.lizard.net/wms',
      'tiled': true,
      'rescalable': true,
      'scale': 'nominal',
      'quantity': null,
      'unit': null,
      'aggregation_type': 'curve',
      'load_order': null,
      'options': {
        'styles': 'BrBG_r',
        'effects': 'shade:0:3'
      },
      'bounds': {},
      'color': '',
      'event_count': 0,
      "meta": "no metadata for this layer format."
    },
    {
      'slug': 'dem/nl',
      'type': 'Raster',
      'format': 'Store',
      'min_zoom': 0,
      'max_zoom': 31,
      'z_index': 0,
      'url': '/api/v1/rasters',
      'tiled': true,
      'rescalable': false,
      'scale': 'interval',
      'quantity': 'Hoogte',
      'unit': 'm NAP',
      'aggregation_type': 'curve',
      'load_order': null,
      'options': {},
      'bounds': {},
      'color': '',
      'event_count': 0,
      "meta": "no metadata for this layer format."
    }
    ]
  },
  'waterchain': {
    'name': 'Water',
    'slug': 'waterchain',
    'active': true,
    'temporal': false,
    'temporal_resolution': 0,
    'opacity': 1.0,
    'order': 5,
    'baselayer': false,
    'layers': [
    {
      'slug': 'waterchain_png',
      'type': 'Asset',
      'format': 'TMS',
      'min_zoom': 7,
      'max_zoom': 31,
      'z_index': 3,
      'url': '/api/v1/tiles',
      'tiled': true,
      'rescalable': false,
      'scale': 'nominal',
      'quantity': null,
      'unit': null,
      'aggregation_type': 'none',
      'load_order': 100,
      'options': {},
      'bounds': {},
      'color': '',
      'event_count': 0,
      "meta": "no metadata for this layer format."
    },
    {
      'slug': 'waterchain_grid',
      'type': 'Asset',
      'format': 'UTFGrid',
      'min_zoom': 7,
      'max_zoom': 31,
      'z_index': 4,
      'url': '/api/v1/tiles',
      'tiled': true,
      'rescalable': false,
      'scale': 'nominal',
      'quantity': null,
      'unit': null,
      'aggregation_type': 'none',
      'load_order': null,
      'options': {},
      'bounds': {},
      'color': '',
      'event_count': 0,
      "meta": "no metadata for this layer format."
    }
    ]
  },
  'soil': {
    'name': 'Bodem',
    'slug': 'soil',
    'active': false,
    'temporal': false,
    'temporal_resolution': 0,
    'opacity': 1.0,
    'order': 4,
    'baselayer': false,
    'layers': [
    {
      'slug': 'isahw:BOFEK2012',
      'type': 'Raster',
      'format': 'WMS',
      'min_zoom': 0,
      'max_zoom': 31,
      'z_index': 0,
      'url': 'http://geoserver6.lizard.net/geoserver/isahw/wms',
      'tiled': true,
      'rescalable': false,
      'scale': 'nominal',
      'quantity': null,
      'unit': null,
      'aggregation_type': 'none',
      'load_order': null,
      'options': {
        'styles': '',
        'transparent': 'true',
        'tiled': 'true'
      },
      'bounds': {},
      'color': '',
      'event_count': 0,
      "meta": "no metadata for this layer format."
    }
    ]
  },
  'alarm': {
    'name': 'Alarm',
    'slug': 'alarm',
    'active': false,
    'temporal': true,
    'temporal_resolution': 4,
    'opacity': 1.0,
    'order': 7,
    'baselayer': false,
    'layers': [
    {
      'slug': 'alarm',
      'type': 'Event',
      'format': 'Vector',
      'min_zoom': 11,
      'max_zoom': 31,
      'z_index': null,
      'url': '/api/v1/tiles',
      'tiled': true,
      'rescalable': false,
      'scale': 'nominal',
      'quantity': '',
      'unit': '',
      'aggregation_type': 'none',
      'load_order': null,
      'options': {},
      'bounds': {},
      'color': '#c0392b',
      'event_count': 6,
      "meta": {
        "temporal_resolution": 0,
        "temporal_bounds": {
            "start": 1325458800000.0,
            "end": 1409781600000.0
        },
        "spatial_bounds": {
            "west": 4.901057753,
            "east": 5.008115838,
            "north": 52.58351724,
            "south": 52.47932247
        }
      }
    }
    ]
  }
};