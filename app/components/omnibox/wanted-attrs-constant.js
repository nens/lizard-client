'use strict;'

angular.module('omnibox')
.service("WantedAttributes", ["gettext", function (gettext) {

  this.pump = {
    rows: [
      {
        keyName: gettext("Capacity"),
        attrName: "capacity",
        ngBindValue:
          "asset.selectedAsset.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "  (m<sup>3</sup> / uur)",
        defaultValue: "12"
      },
      {
        /// Aanslagpeil
        keyName: gettext("Start level"),
        attrName: "start_level",
        ngBindValue:
          "asset.selectedAsset.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        /// Afslagpeil
        keyName: gettext("Stop level"),
        attrName: "stop_level",
        ngBindValue:
          "asset.selectedAsset.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.8"
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
        defaultValue: "Liggerbrug"
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 8
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 17
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 2
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
        defaultValue: "Watergang"
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type",
        valueSuffix: "",
        defaultValue: "Boezem"
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
        defaultValue: "Dwarsdoorsnede"
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
        valueSuffix: " (m)",
        defaultValue: "2"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "8"
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.5"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | lookupCulvertMaterial",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupCulvertShape",
        valueSuffix: "",
        defaultValue: "rechthoekig"
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
        valueSuffix: " (m)",
        defaultValue: ""
      },
      {
        /// Onderkant filter
        keyName: gettext("Filter bottom level"),
        attrName: "filter_bottom_level",
        ngBindValue: "asset.selectedAsset.filter_bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: ""
      },
      {
        keyName: gettext("Aquifer confinement"),
        attrName: "aquifer_confiment",
        ngBindValue: "asset.selectedAsset.aquifer_confiment",
        valueSuffix: " (m)",
        defaultValue: ""
      },
      {
        /// bodemsoort
        keyName: gettext("Litology"),
        attrName: "litology",
        ngBindValue: "asset.selectedAsset.litology",
        valueSuffix: " (m)",
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
        valueSuffix: " (m)",
        defaultValue: ""
      },
      {
        /// Bovenkant buis
        keyName: gettext("Top level"),
        attrName: "top_level",
        ngBindValue: "waterchain.top_level",
        valueSuffix: " (m)",
        defaultValue: ""
      },
      {
        /// Onderkan buis
        keyName: gettext("Bottom level"),
        attrName: "bottom_level",
        ngBindValue: "waterchain.bottom_level",
        valueSuffix: " (m)",
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
        valueSuffix: " (mNAP)",
        defaultValue: "2"
      },
      {
        /// Bekleding
        keyName: gettext("Coating"),
        attrName: "coating",
        ngBindValue:
          "waterchain.coating",
        valueSuffix: "",
        defaultValue: "gras"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material",
        valueSuffix: "",
        defaultValue: "zand"
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
        defaultValue: "Referentiemeetpunt"
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
        defaultValue: "0-7361"
      },
      {
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue:
          "waterchain.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.42"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: gettext("Widht"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupManholeShape",
        valueSuffix: "",
        defaultValue: "vierkant"
      },
      {
        /// Putbodem
        keyName: gettext("Bottom level manhole"),
        attrName: "bottom_level",
        ngBindValue:
          "waterchain.bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-1.6"
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
        defaultValue: "KNMI"
      },
      {
        keyName: gettext("Category"),
        attrName: "category",
        ngBindValue: "waterchain.category",
        valueSuffix: "",
        defaultValue: "KNMI-AWS"
      },
      {
        keyName: gettext("Frequency"),
        attrName: "frequency",
        ngBindValue: "waterchain.frequency",
        valueSuffix: "",
        defaultValue: "1x per uur"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: "6278"
      }
    ]
  };

  this.monitoringwell = {
    rows: [
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
        defaultValue: "3105"
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.2"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | truncate: 20",
        valueSuffix: "",
        defaultValue: "rechthoekig"
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
        defaultValue: "6-549"
      },
      {
        /// Buitenwaterstand (gemiddeld)
        keyName: gettext("Open water level (average)"),
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.open_water_level_average | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.1"
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
        defaultValue: "12-72297"
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level",
        valueSuffix: " (mNAP)",
        defaultValue: "0.2"
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
        defaultValue: "gemengd stelsel"
      },
      {
        /// BOB beginpunt
        keyName: gettext("Invert level start point"),
        attrName: "invert_level_start_point",
        ngBindValue:
          "waterchain.invert_level_start_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.1"
      },
      {
        /// BOB eindpunt
        keyName: gettext("Invert level end point"),
        attrName: "invert_level_end_point",
        ngBindValue:
          "waterchain.invert_level_end_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.12"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "28"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape | lookupPipeShape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: "0-985-0-986"
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
        defaultValue: "onbekend"
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.type | lookupPressurePipeType",
        valueSuffix: "",
        defaultValue: "transportleiding"
      },
      {
        keyName: gettext("Construction year"),
        attrName: "year_of_construction",
        ngBindValue:
          "waterchain.year_of_construction",
        valueSuffix: "",
        defaultValue: "2006"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: "776"
      },
      {
        keyName: gettext("Diameter"),
        attrName: "diameter",
        ngBindValue:
          "waterchain.diameter | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.shape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.length",
        valueSuffix: " (m)",
        defaultValue: "154"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: "HDPE"
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
        defaultValue: "gemaal"
      },
      {
        keyName: gettext("Capacity"),
        attrName: "capacity",
        ngBindValue:
          "waterchain.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "  (m<sup>3</sup> / uur)",
        defaultValue: "54"
      },
      {
        keyName: gettext("Name"),
        attrName: "name",
        ngBindValue: "waterchain.name",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.code",
        valueSuffix: "",
        defaultValue: "127"
      },
      {
        /// Aanslagpeil
        keyName: gettext("Start level"),
        attrName: "start_level",
        ngBindValue:
          "waterchain.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        /// Afslagpeil
        keyName: gettext("Stop level"),
        attrName: "stop_level",
        ngBindValue:
          "waterchain.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.8"
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
        defaultValue: 'onbekend'
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
        defaultValue: "onbekend"
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
        defaultValue: "473"
      },
      {
        keyName: gettext("Width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      },
      {
        /// Niveau
        keyName: gettext("Crest Level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.3"
      },
      {
        /// Bediening
        keyName: gettext("Control"),
        attrName: "controlled",
        ngBindValue:
          "waterchain.controlled | lookupWeirControl",
        valueSuffix: "",
        defaultValue: "RTC"
      },
    ]
  };

}]);
