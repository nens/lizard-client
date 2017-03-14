'use strict';

angular.module('omnibox')
.service("WantedAttributes", ["gettext", function (gettext) {

  this.pump = {
    rows: [
      {
        keyName: gettext("Capacity"),
        attrName: "capacity",
        ngBindValue:
          "waterchain.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "m<sup>3</sup> / uur"
      },
      {
        /// Aanslagpeil
        keyName: gettext("Start level"),
        attrName: "start_level",
        ngBindValue:
          "waterchain.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        /// Afslagpeil
        keyName: gettext("Stop level"),
        attrName: "stop_level",
        ngBindValue:
          "waterchain.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      }
    ]
  };

  this.bridge = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue: "waterchain.type",
        valueSuffix: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.height | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      }
    ]
  };

  this.building = {
    rows: [
      {
        keyName: gettext("Function"),
        attrName: "function",
        ngBindValue: "waterchain.function[0].name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Address"),
        attrName: "address",
        ngBindValue: "waterchain.addresses[0].street + ' ' + "
          + "waterchain.addresses[0].house_number",
        valueSuffix: ""
      },
      {
        keyName: gettext("Zipcode"),
        attrName: "zipcode",
        ngBindValue: "waterchain.addresses[0].zipcode",
        valueSuffix: ""
      },
      {
        keyName: gettext("City"),
        attrName: "city",
        ngBindValue: "waterchain.addresses[0].city",
        valueSuffix: ""
      }
    ]
  };

  this.road = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue: "waterchain.type",
        valueSuffix: ""
      },
      {
        keyName: gettext("Use"),
        attrName: "use",
        ngBindValue: "waterchain.use",
        valueSuffix: ""
      }
    ]
  };

  this.channel_Boezem = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type",
        valueSuffix: ""
      }
    ]
  };

  this.crossprofile = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type | niceNumberOrEllipsis: 2",
        valueSuffix: ""
      }
    ]
  };

  this.culvert = {
    rows: [
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.height | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | lookupCulvertMaterial",
        valueSuffix: ""
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupCulvertShape",
        valueSuffix: ""
      }
    ]
  };

  this.filter = {
    rows: [
      {
        /// Bovenkant filter
        keyName: gettext("Filter top level"),
        attrName: "filter_top_level",
        ngBindValue: "waterchain.filter_top_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        /// Onderkant filter
        keyName: gettext("Filter bottom level"),
        attrName: "filter_bottom_level",
        ngBindValue: "waterchain.filter_bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        keyName: gettext("Aquifer confinement"),
        attrName: "aquifer_confiment",
        ngBindValue: "waterchain.aquifer_confiment",
        valueSuffix: "m"
      },
      {
        /// bodemsoort
        keyName: gettext("Lithology"),
        attrName: "litology",
        ngBindValue: "waterchain.litology",
        valueSuffix: "m"
      },

    ]
  };

  this.groundwaterstation = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue: "waterchain.surface_level",
        valueSuffix: "m (NAP)"
      },
      {
        /// Bovenkant buis
        keyName: gettext("Top level"),
        attrName: "top_level",
        ngBindValue: "waterchain.top_level",
        valueSuffix: "m (NAP)"
      },
      {
        /// Onderkan buis
        keyName: gettext("Bottom level"),
        attrName: "bottom_level",
        ngBindValue: "waterchain.bottom_level",
        valueSuffix: "m (NAP)"
      }
    ]
  };

  this.levee = {
    rows: [
      {
        /// Kruinhoogte
        keyName: gettext("Crest height"),
        attrName: "crest_height",
        ngBindValue:
          "waterchain.crest_height | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        /// Bekleding
        keyName: gettext("Coating"),
        attrName: "coating",
        ngBindValue:
          "waterchain.coating",
        valueSuffix: ""
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material",
        valueSuffix: ""
      }
    ]
  };

  this.leveecrosssection = {
    rows: [
      {
        /// Naam
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name"
      }
    ]
  };

  this.leveereferencepoint = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type",
        valueSuffix: ""
      }
    ]
  };

  this.manhole = {
    rows: [
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue:
          "waterchain.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material",
        valueSuffix: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupManholeShape",
        valueSuffix: ""
      },
      {
        /// Putbodem
        keyName: gettext("Bottom level manhole"),
        attrName: "bottom_level",
        ngBindValue:
          "waterchain.bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      }
    ],
  };

  this.measuringstation = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        keyName: gettext("Category"),
        attrName: "category",
        ngBindValue: "waterchain.category",
        valueSuffix: ""
      },
      {
          keyName: gettext("Node"),
          attrName: "node",
          ngBindValue:
            "waterchain.ts.node.name",
          valueSuffix: ""
      },
      {
        keyName: gettext("Compartment"),
        attrName: "compartment",
        ngBindValue: "waterchain.ts.observation_type.compartment",
        valueSuffix: ""
      },
      {
          keyName: gettext("Time series"),
          attrName: "url",
          ngBindValue:
            "waterchain.timeseries_url",
          valueSuffix: ""
      },
      {
        keyName: gettext("Start"),
        attrName: "start",
        ngBindValue: "waterchain.ts.start | date:'yyyy-MM-dd HH:mm:ss Z'",
        valueSuffix: ""
      },
      {
        keyName: gettext("End"),
        attrName: "end",
        ngBindValue: "waterchain.ts.end | date:'yyyy-MM-dd HH:mm:ss Z'",
        valueSuffix: ""
      },
      {
        keyName: gettext("Interval"),
        attrName: "interval",
        ngBindValue: "waterchain.ts.interval",
        valueSuffix: ""
      }
      /*
      {
        keyName: gettext("Frequency"),
        attrName: "frequency",
        ngBindValue: "waterchain.frequency",
        valueSuffix: ""
      }
      */
    ]
  };

  this.monitoringwell = {
    rows: [
      {
        keyName: gettext("Distance along cross section"),
        attrName: "distance_along_crosssection",
        ngBindValue:
          "waterchain.distance_along_crosssection | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Well top level"),
        attrName: "well_top_level",
        ngBindValue: "waterchain.well_top_level",
        valueSuffix: ""
      },
      {
        keyName: gettext("Well bottom level"),
        attrName: "well_bottom_level",
        ngBindValue:
          "waterchain.well_bottom_level",
        valueSuffix: ""
      }
    ]
  };

  this.orifice = {
    rows: [
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | truncate: 20",
        valueSuffix: ""
      }
    ]
  };

  this.outlet = {
    rows: [
      {
        keyName: gettext("Manhole id"),
        attrName: "manhole_id",
        ngBindValue:
          "waterchain.manhole_id | niceNumberOrEllipsis: 2",
        valueSuffix: ""
      },
      {
        /// Buitenwaterstand (gemiddeld)
        keyName: gettext("Open water level (average)"),
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.open_water_level_average | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      }
    ]
  };

  this.overflow = {
    rows: [
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width",
        valueSuffix: "m"
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level",
        valueSuffix: "m (NAP)"
      },
      {
        /// Sensorhoogte
        keyName: gettext("Sensor level"),
        attrName: "sensor_level",
        ngBindValue:
          "waterchain.sensor_level",
        valueSuffix: "m (NAP)"
      },
      {
        /// Maaiveldhoogte
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue:
          "waterchain.surface_level",
        valueSuffix: "m (NAP)"
      }
    ]
  };

  this.pipe = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type | lookupPipeType",
        valueSuffix: ""
      },
      {
        /// BOB beginpunt
        keyName: gettext("Invert level start point"),
        attrName: "invert_level_start_point",
        ngBindValue:
          "waterchain.invert_level_start_point | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        /// BOB eindpunt
        keyName: gettext("Invert level end point"),
        attrName: "invert_level_end_point",
        ngBindValue:
          "waterchain.invert_level_end_point | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | pipeMaterialOrEllipsis",
        valueSuffix: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupPipeShape",
        valueSuffix: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      }
    ]
  };

  this.pressurepipe = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type | lookupPressurePipeType",
        valueSuffix: ""
      },
      {
        keyName: gettext("Construction year"),
        attrName: "year_of_construction",
        ngBindValue:
          "waterchain.year_of_construction",
        valueSuffix: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        keyName: gettext("Diameter"),
        attrName: "diameter",
        ngBindValue:
          "waterchain.diameter | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape",
        valueSuffix: ""
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length",
        valueSuffix: "m"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | pipeMaterialOrEllipsis",
        valueSuffix: ""
      }
    ]
  };

  this.pumpstation = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue: "waterchain.type",
        valueSuffix: ""
      },
      {
        keyName: gettext("Capacity"),
        attrName: "capacity",
        ngBindValue:
          "waterchain.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "m<sup>3</sup> / uur"
      },
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        /// Aanslagpeil
        keyName: gettext("Start level"),
        attrName: "start_level",
        ngBindValue:
          "waterchain.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        /// Afslagpeil
        keyName: gettext("Stop level"),
        attrName: "stop_level",
        ngBindValue:
          "waterchain.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      }
    ]
  };

  /// Some fugly hardcoded translations for pumped drainage areas:
  gettext('sanitary');
  gettext('combined');
  gettext('other');

  this.pumpeddrainagearea = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue:
          "waterchain.name",
        valueSuffix: ""
      },
      {
        /// Type stelsel
        keyName: gettext("Sewer system"),
        attrName: "sewer_system ",
        ngBindValue:
          "waterchain.sewer_system | translate",
        valueSuffix: ""
      },
      {
        keyName: gettext("Pump station"),
        attrName: "pump_station.code",
        ngBindValue:
          "waterchain.pump_station.code",
        valueSuffix: ""
      },
      {
        keyName: gettext("Pump station capacity"),
        attrName: "pump_station.capacity",
        ngBindValue:
          "waterchain.pump_station.capacity | niceNumberOrEllipsis: 2",
        valueSuffix: "m3/h"
      },
      {
        keyName: gettext("Inhabitants"),
        attrName: "inhabitants",
        ngBindValue:
          "waterchain.inhabitants | niceNumberOrEllipsis: 2",
        valueSuffix: ""
      },
      {
        keyName: gettext("Population equivalent"),
        attrName: "population_equivalent",
        ngBindValue:
          "waterchain.population_equivalent | niceNumberOrEllipsis: 2",
        valueSuffix: ""
      },
      {
        keyName: gettext("Water consumption"),
        attrName: "water_consumption",
        ngBindValue:
          "waterchain.water_consumption | niceNumberOrEllipsis: 2",
        valueSuffix: "m3/h"
      },
      {
        keyName: gettext("Pollution equivalent"),
        attrName: "pollution_equivalent",
        ngBindValue:
          "waterchain.pollution_equivalent | niceNumberOrEllipsis: 2",
        valueSuffix: ""
      },
      {
        keyName: gettext("Sanitary load"),
        attrName: "sanitary_load",
        ngBindValue:
          "waterchain.sanitary_load | niceNumberOrEllipsis: 2",
        valueSuffix: "m3/h"
      },
      {
        keyName: gettext("Connected impervious surface"),
        attrName: "connected_impervious_surface",
        ngBindValue:
          "waterchain.connected_impervious_surface | niceNumberOrEllipsis: 2",
        valueSuffix: "ha"
      },
      {
        keyName: gettext("Water retention capacity"),
        attrName: "water_retention_capacity",
        ngBindValue:
          "waterchain.water_retention_capacity | niceNumberOrEllipsis: 2",
        valueSuffix: "mm"
      },
      {
        keyName: gettext("Minimum overflow crest level"),
        attrName: "minimum_overflow_crest_level",
        ngBindValue:
          "waterchain.minimum_overflow_crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        keyName: gettext("Upstream load"),
        attrName: "upstream_load",
        ngBindValue:
          "waterchain.upstream_load | niceNumberOrEllipsis: 2",
        valueSuffix: "m3/h"
      },
      {
        keyName: gettext("Down stream area"),
        attrName: "downstream_pumped_drainage_area.name",
        ngBindValue:
          "waterchain.downstream_pumped_drainage_area.name",
        valueSuffix: ""
      },
      {
        keyName: gettext("Extraneous water"),
        attrName: "extraneous_water",
        ngBindValue:
          "waterchain.extraneous_water | niceNumberOrEllipsis: 2",
        valueSuffix: "m3/h"
      },
    ]
  };

  this.sluice = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue:
          "waterchain.name",
        valueSuffix: ""
      }
    ]
  };

  this.wastewatertreatmentplant = {
    rows: [ //Afvalwaterzuiveringsinstallatie
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: ""
      },
    ]
  };

  this.weir = {
    rows: [
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: "m"
      },
      {
        /// Niveau
        keyName: gettext("Crest Level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)"
      },
      {
        /// Bediening
        keyName: gettext("Control"),
        attrName: "controlled",
        ngBindValue:
          "waterchain.controlled | lookupWeirControl",
        valueSuffix: ""
      },
    ]
  };

}]);
