'use strict;'

angular.module('omnibox')
.service("WantedAttributes", ["gettext", function (gettext) {

  this.bridge = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "Liggerbrug"
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 8
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 17
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 2
      }
    ]
  };

  this.channel_Boezem = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "Watergang"
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
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
          "waterchain.layers.waterchain_grid.data.type | niceNumberOrEllipsis: 2",
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
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "2"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "8"
      },
      {
        keyName: gettext("Height"),
        attrName: "height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.5"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | lookupCulvertMaterial",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | lookupCulvertShape",
        valueSuffix: "",
        defaultValue: "rechthoekig"
      }
    ]
  };

  this.groundwaterstation = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.surface_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        /// Bovenkant buis
        keyName: gettext("Top level"),
        attrName: "top_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.top_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        /// Onderkan buis
        keyName: gettext("Bottom level"),
        attrName: "bottom_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.bottom_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        /// Bovenkant filter
        keyName: gettext("Filter top level"),
        attrName: "filter_top_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.filter_top_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        /// Onderkant filter
        keyName: gettext("Filter bottom level"),
        attrName: "filter_bottom_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.filter_bottom_level",
        valueSuffix: " (mNAP)",
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
          "waterchain.layers.waterchain_grid.data.crest_height | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "2"
      },
      {
        /// Bekleding
        keyName: gettext("Coating"),
        attrName: "coating",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.coating",
        valueSuffix: "",
        defaultValue: "gras"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material",
        valueSuffix: "",
        defaultValue: "zand"
      }
    ]
  };

  this.leveereferencepoint = {
    rows: [
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
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
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "0-7361"
      },
      {
        keyName: gettext("Surface level"),
        attrName: "surface_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.42"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: gettext("Widht"),
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | lookupManholeShape",
        valueSuffix: "",
        defaultValue: "vierkant"
      },
      {
        /// Putbodem
        keyName: gettext("Bottom level manhole"),
        attrName: "bottom_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-1.6"
      }
    ],
  };

  this.measuringstation = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "KNMI"
      },
      {
        keyName: gettext("Category"),
        attrName: "category",
        ngBindValue: "waterchain.layers.waterchain_grid.data.category",
        valueSuffix: "",
        defaultValue: "KNMI-AWS"
      },
      {
        keyName: gettext("Frequency"),
        attrName: "frequency",
        ngBindValue: "waterchain.layers.waterchain_grid.data.frequency",
        valueSuffix: "",
        defaultValue: "1x per uur"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "6278"
      }
    ]
  };

  this.orifice = {
    rows: [
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "3105"
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.2"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | truncate: 20",
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
          "waterchain.layers.waterchain_grid.data.manhole_id | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: "6-549"
      },
      {
        /// Buitenwaterstand (gemiddeld)
        keyName: gettext("Open water level (average)"),
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_average | niceNumberOrEllipsis: 2",
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
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "12-72297"
      },
      {
        /// Overstortbreedte
        keyName: gettext("Crest width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        /// Overstorthoogte
        keyName: gettext("Crest level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level",
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
          "waterchain.layers.waterchain_grid.data.type | lookupPipeType",
        valueSuffix: "",
        defaultValue: "gemengd stelsel"
      },
      {
        /// BOB beginpunt
        keyName: gettext("Invert level start point"),
        attrName: "invert_level_start_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_start_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.1"
      },
      {
        /// BOB eindpunt
        keyName: gettext("Invert level end point"),
        attrName: "invert_level_end_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_end_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.12"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "28"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: gettext("Width"),
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | lookupPipeShape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "0-985-0-986"
      }
    ]
  };

  this.pressurepipe = {
    rows: [
      {
        keyName: gettext("Name"),
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
      {
        keyName: gettext("Type"),
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type | lookupPressurePipeType",
        valueSuffix: "",
        defaultValue: "transportleiding"
      },
      {
        keyName: gettext("Construction year"),
        attrName: "year_of_construction",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.year_of_construction",
        valueSuffix: "",
        defaultValue: "2006"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "776"
      },
      {
        keyName: gettext("Diameter"),
        attrName: "diameter",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.diameter | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      },
      {
        keyName: gettext("Shape"),
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      {
        keyName: gettext("Length"),
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length",
        valueSuffix: " (m)",
        defaultValue: "154"
      },
      {
        keyName: gettext("Material"),
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | pipeMaterialOrEllipsis",
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
        ngBindValue: "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "gemaal"
      },
      {
        keyName: gettext("Capacity"),
        attrName: "capacity",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "  (m<sup>3</sup> / uur)",
        defaultValue: "54"
      },
      {
        keyName: gettext("Name"),
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
      {
        keyName: gettext("Code"),
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "127"
      },
      {
        /// Aanslagpeil
        keyName: gettext("Start level"),
        attrName: "start_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        /// Afslagpeil
        keyName: gettext("Stop level"),
        attrName: "stop_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
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
        attrName: "display_name",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: 'onbekend'
      }
    ]
  };

  this.wastewatertreatmentplant = {
    rows: [ //Afvalwaterzuiveringsinstallatie
      {
        keyName: gettext("Name"),
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
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
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "473"
      },
      {
        keyName: gettext("Width"),
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      },
      {
        /// Niveau
        keyName: gettext("Crest Level"),
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.3"
      },
      {
        /// Bediening
        keyName: gettext("Control"),
        attrName: "controlled",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.controlled | lookupWeirControl",
        valueSuffix: "",
        defaultValue: "RTC"
      },
    ]
  };

}]);
