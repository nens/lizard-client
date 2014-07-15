app.service("CabinetService", ["$q", "Restangular",
  function ($q, Restangular) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;
  var overlayers = window.overLayers;
  var eventTypes = window.event_types;
  var lastVisitUtime = window.last_visit_utime;

  var termSearchResource,
      bboxSearchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource;

  Restangular.setRequestSuffix('?page_size=0');
  // termSearchResource = $resource('/api/v1/search/',{isArray: true});
  // bboxSearchResource = $resource('/api/v1/search/',{isArray: true});
  geocodeResource = Restangular.one('api/v1/geocode/');
  reverseGeocodeResource = Restangular.one('api/v1/reversegeocode/');
  timeseriesResource = Restangular.one('api/v1/timeseries/');

  var wantedAttrs = {
    bridge: {
      rows: [
        {
          keyName: "Type",
          attrName: "type",
          ngBindValue: "pointObject.attrs.data.type",
          valueSuffix: ""
        },
        {
          keyName: "Breedte",
          attrName: "width",
          ngBindValue:
            "pointObject.attrs.data.width | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Lengte",
          attrName: "length",
          ngBindValue:
            "pointObject.attrs.data.length | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Hoogte",
          attrName: "height",
          ngBindValue:
            "pointObject.attrs.data.height | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        }
      ]
    },
    channel: {
      rows: [
        {
          keyName: "Type",
          attrName: "type",
          ngBindValue: "pointObject.attrs.data.type | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Lengte",
          attrName: "length",
          ngBindValue: "pointObject.attrs.data.length | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        }
      ]
    },
    crossprofile: {
      rows: [
        {
          keyName: "Type",
          attrName: "type",
          ngBindValue:
            "pointObject.attrs.data.type | niceNumberOrEllipsis: 2",
          valueSuffix: ""
        }
      ]
    },
    culvert: {
      rows: [
        {
          keyName: "Type",
          attrName: "type",
          ngBindValue:
            "pointObject.attrs.data.type | truncate: 20",
          valueSuffix: ""
        },
        {
          keyName: "Lengte",
          attrName: "length",
          ngBindValue:
            "pointObject.attrs.data.length | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Breedte",
          attrName: "width",
          ngBindValue:
            "pointObject.attrs.data.width | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        }
      ]
    },
    manhole: {
      rows: [
        {
          keyName: "Maaiveld",
          attrName: "surface_level",
          ngBindValue:
            "pointObject.attrs.data.surface_level | niceNumberOrEllipsis: 2",
          valueSuffix: " m NAP"
        },
        {
          keyName: "Breedte",
          attrName: "width",
          ngBindValue:
            "pointObject.attrs.data.width | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Vorm",
          attrName: "shape",
          ngBindValue:
            "pointObject.attrs.data.shape | lookupManholeShape",
          valueSuffix: ""
        },
        {
          keyName: "Putbodem",
          attrName: "bottom_level",
          ngBindValue:
            "pointObject.attrs.data.bottom_level | niceNumberOrEllipsis: 2",
          valueSuffix: " m NAP"
        },
        {
          keyName: "Materiaal",
          attrName: "material",
          ngBindValue:
            "pointObject.attrs.data.material | lookupManholeMaterial",
          valueSuffix: ""
        }
      ],
    },
    measuringstation: {
      rows: [
        {
          keyName: "Naam",
          attrName: "name",
          ngBindValue: "pointObject.attrs.data.name",
          valueSuffix: ""
        },
        {
          keyName: "Regio",
          attrName: "region",
          ngBindValue: "pointObject.attrs.data.region",
          valueSuffix: ""
        },
        {
          keyName: "Categorie",
          attrName: "category",
          ngBindValue: "pointObject.attrs.data.category",
          valueSuffix: ""
        },
        {
          keyName: "Frequentie",
          attrName: "frequency",
          ngBindValue: "pointObject.attrs.data.frequency",
          valueSuffix: ""
        }
      ]
    },
    /*orifice: { // NB! The info table needs more data: "lengte * breedte" is undefined atm.
      rows: [
        {
          keyName: "Lengte x Breedte",
          attrName: "length",
          ngBindValue:
            "",
          valueSuffix: ""
        }
      ]
    }, */
    outlet: {
      rows: [
        {
          keyName: "Maaiveld",
          attrName: "open_water_level_average",
          ngBindValue:
            "pointObject.attrs.data.open_water_level_average | niceNumberOrEllipsis: 2",
          valueSuffix: " m NAP"
        }
      ]
    },
    overflow: {
      rows: [
        {
          keyName: "Breedte",
          attrName: "width",
          ngBindValue: "pointObject.attrs.data.width | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Overstorthoogte",
          attrName: "crest_level",
          ngBindValue: "pointObject.attrs.data.crest_level | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        }
      ]
    },
    pipe: {
      rows: [
        {
          keyName: "Lengte",
          attrName: "length",
          ngBindValue:
            "pointObject.attrs.data.length | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Breedte",
          attrName: "width",
          ngBindValue:
            "pointObject.attrs.data.width | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        },
        {
          keyName: "Vorm",
          attrName: "shape",
          ngBindValue:
            "pointObject.attrs.data.shape | lookupPipeShape",
          valueSuffix: ""
        },
        {
          keyName: "Materiaal",
          attrName: "material",
          ngBindValue:
            "pointObject.attrs.data.material | pipeMaterialOrEllipsis",
          valueSuffix: ""
        }
      ]
    },
    pumpstation_sewerage: {
      rows: [
        {
          keyName: "Naam",
          attrName: "name",
          ngBindValue: "pointObject.attrs.data.name",
          valueSuffix: ""
        },
        {
          keyName: "Aanslagpeil",
          attrName: "start_level",
          ngBindValue:
            "pointObject.attrs.data.start_level | niceNumberOrEllipsis: 2",
          valueSuffix: " m boven NAP"
        },
        {
          keyName: "Afslagpeil",
          attrName: "stop_level",
          ngBindValue:
            "pointObject.attrs.data.stop_level | niceNumberOrEllipsis: 2",
          valueSuffix: " m boven NAP"
        },
        {
          keyName: "Capaciteit",
          attrName: "capacity",
          ngBindValue:
            "pointObject.attrs.data.capacity | niceNumberOrEllipsis: 2",
          valueSuffix: " l/s"
        }
      ]
    },
    pumpstation_non_sewerage: {
      rows: [
        {
          keyName: "Naam",
          attrName: "name",
          ngBindValue: "pointObject.attrs.data.name",
          valueSuffix: ""
        },
        {
          keyName: "Aanslagpeil",
          attrName: "start_level",
          ngBindValue:
            "pointObject.attrs.data.start_level | niceNumberOrEllipsis: 2",
          valueSuffix: " m boven NAP"
        },
        {
          keyName: "Capaciteit",
          attrName: "capacity",
          ngBindValue:
            "pointObject.attrs.data.capacity | niceNumberOrEllipsis: 2",
          valueSuffix: " l/s"
        }
      ]
    },
    weir: {
      rows: [
        {
          keyName: "Type",
          attrName: "type",
          ngBindValue: "pointObject.attrs.data.type",
          valueSuffix: ""
        },
        {
          keyName: "Breedte",
          attrName: "width", // NB! this was set to "breedte" in the original code, which is supposedly erronious (?)
          ngBindValue: "pointObject.attrs.data.width | niceNumberOrEllipsis: 2", // see commnent above
          valueSuffix: " m"
        },
        {
          keyName: "Hoogte",
          attrName: "height",
          ngBindValue: "pointObject.attrs.data.height | niceNumberOrEllipsis: 2",
          valueSuffix: " m"
        }
      ]
    }
  };

  var abortGet;
  var rasterResource = function () {
    if (abortGet) {
      abortGet.resolve();
    }
    abortGet = $q.defer();
    return Restangular
      .one('api/v1/rasters/')
      .withHttpConfig({timeout: abortGet.promise});
  };

  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    overlayers: overlayers,
    eventTypes: eventTypes,
    // termSearch: termSearchResource,
    // bboxSearch: bboxSearchResource,
    geocode: geocodeResource,
    raster: rasterResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    panZoom: null,
    lastVisitUtime: lastVisitUtime,
    wantedAttrs: wantedAttrs
  };
}]);
