'use strict';

angular.module('omnibox')
.service("WantedAttributes", ["gettext", function (gettext) {

  this.pump = {
    rows: [
      {
        keyName: gettext("Capacity"),
        attrName: "capacity",
        ngBindValue:
          "asset.selectedAsset.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "m<sup>3</sup> / uur",
        defaultValue: ""
      },
      {
        /// Aanslagpeil
        keyName: gettext("Start level"),
        attrName: "start_level",
        ngBindValue:
          "asset.selectedAsset.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        /// Afslagpeil
        keyName: gettext("Stop level"),
        attrName: "stop_level",
        ngBindValue:
          "asset.selectedAsset.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      }
    ]
  };

  this.bridge = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue: "waterchain.type",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.height | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      }
    ]
  };

  this.channel_Boezem = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type",
        valueSuffix: "",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
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
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.height | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | lookupCulvertMaterial",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupCulvertShape",
        valueSuffix: "",
        defaultValue: ""
      }
    ]
  };

  this.filter = {
    rows: [
      {
        /// Bovenkant filter
        keyName: gettext("Filter top level"),
        attrName: "filter_top_level",
        ngBindValue: "asset.selectedAsset.filter_top_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        /// Onderkant filter
        keyName: gettext("Filter bottom level"),
        attrName: "filter_bottom_level",
        ngBindValue: "asset.selectedAsset.filter_bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Aquifer confinement"),
        attrName: "aquifer_confiment",
        ngBindValue: "asset.selectedAsset.aquifer_confiment",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        /// bodemsoort
        keyName: gettext("Litology"),
        attrName: "litology",
        ngBindValue: "asset.selectedAsset.litology",
        valueSuffix: "m",
        defaultValue: ""
      },

    ]
  };

  this.groundwaterstation = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue: "waterchain.surface_level",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        /// Bovenkant buis
        keyName: gettext("Top level"),
        attrName: "top_level",
        ngBindValue: "waterchain.top_level",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        /// Onderkan buis
        keyName: gettext("Bottom level"),
        attrName: "bottom_level",
        ngBindValue: "waterchain.bottom_level",
        valueSuffix: "m",
        defaultValue: ""
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
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        /// Bekleding
        keyName: gettext("Coating"),
        attrName: "coating",
        ngBindValue:
          "waterchain.coating",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material",
        valueSuffix: "",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue:
          "waterchain.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupManholeShape",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        /// Putbodem
        keyName: gettext("Bottom level manhole"),
        attrName: "bottom_level",
        ngBindValue:
          "waterchain.bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      }
    ],
  };

  this.measuringstation = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Category"),
        attrName: "category",
        ngBindValue: "waterchain.category",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Frequency"),
        attrName: "frequency",
        ngBindValue: "waterchain.frequency",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: ""
      }
    ]
  };

  this.monitoringwell = {
    rows: [
      {
        keyName: gettext("Distance along cross section"),
        attrName: "distance_along_crosssection",
        ngBindValue:
          "waterchain.distance_along_crosssection | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Well top level"),
        attrName: "well_top_level",
        ngBindValue: "waterchain.well_top_level",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Well bottom level"),
        attrName: "well_bottom_level",
        ngBindValue:
          "waterchain.well_bottom_level",
        valueSuffix: "",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | truncate: 20",
        valueSuffix: "",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
      },
      {
        /// Buitenwaterstand (gemiddeld)
        keyName: gettext("Open water level (average)"),
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.open_water_level_average | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level",
        valueSuffix: "m (NAP)",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
      },
      {
        /// BOB beginpunt
        keyName: gettext("Invert level start point"),
        attrName: "invert_level_start_point",
        ngBindValue:
          "waterchain.invert_level_start_point | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        /// BOB eindpunt
        keyName: gettext("Invert level end point"),
        attrName: "invert_level_end_point",
        ngBindValue:
          "waterchain.invert_level_end_point | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupPipeShape",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: ""
      }
    ]
  };

  this.pressurepipe = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type | lookupPressurePipeType",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Construction year"),
        attrName: "year_of_construction",
        ngBindValue:
          "waterchain.year_of_construction",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Diameter"),
        attrName: "diameter",
        ngBindValue:
          "waterchain.diameter | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: ""
      }
    ]
  };

  this.pumpstation = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue: "waterchain.type",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Capacity"),
        attrName: "capacity",
        ngBindValue:
          "waterchain.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "m<sup>3</sup> / uur",
        defaultValue: ""
      },
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        /// Aanslagpeil
        keyName: gettext("Start level"),
        attrName: "start_level",
        ngBindValue:
          "waterchain.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        /// Afslagpeil
        keyName: gettext("Stop level"),
        attrName: "stop_level",
        ngBindValue:
          "waterchain.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      }
    ]
  };

  this.pumped_drainage_area = {
    rows: [
    ]
  };

  this.sluice = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue:
          "waterchain.name",
        valueSuffix: "",
        defaultValue: ""
      }
    ]
  };

  this.wastewatertreatmentplant = {
    rows: [ //Afvalwaterzuiveringsinstallatie
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: "",
        defaultValue: ""
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
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: "m",
        defaultValue: ""
      },
      {
        /// Niveau
        keyName: gettext("Crest Level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: "m (NAP)",
        defaultValue: ""
      },
      {
        /// Bediening
        keyName: gettext("Control"),
        attrName: "controlled",
        ngBindValue:
          "waterchain.controlled | lookupWeirControl",
        valueSuffix: "",
        defaultValue: ""
      },
    ]
  };

}]);
