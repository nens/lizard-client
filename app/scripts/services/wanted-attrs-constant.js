angular.module('lizard-nxt')
  .constant("WantedAttributes", {
  bridge: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "Liggerbrug"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 8
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 17
      },
      {
        keyName: "Hoogte",
        attrName: "height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 2
      }
    ]
  },
  belt_channel: {
    rows: [
      {
        keyName: "Bodemhoogte",
        attrName: "bed_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.bed_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Talud (links)",
        attrName: "talud_left",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.talud_left",
        valueSuffix: "",
        defaultValue: "1:2"
      },
      {
        keyName: "Talud (rechts)",
        attrName: "talud_right",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.talud_right",
        valueSuffix: "",
        defaultValue: "1:2"
      }
    ]
  },
  primary_channel: {
    rows: [
      {
        keyName: "Bodemhoogte",
        attrName: "bed_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.bed_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Talud (links)",
        attrName: "talud_left",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.talud_left",
        valueSuffix: "",
        defaultValue: "1:2"
      },
      {
        keyName: "Talud (rechts)",
        attrName: "talud_right",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.talud_right",
        valueSuffix: "",
        defaultValue: "1:2"
      }
    ]
  },
  channel: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: " (m)",
        defaultValue: "Secundaire watergang"
      },
      {
        keyName: "Bodemhoogte",
        attrName: "bed_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.bed_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Talud (links)",
        attrName: "talud_left",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.talud_left",
        valueSuffix: "",
        defaultValue: "1:2"
      },
      {
        keyName: "Talud (rechts)",
        attrName: "talud_right",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.talud_right",
        valueSuffix: "",
        defaultValue: "1:2"
      }
    ]
  },
  crossprofile: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: "Dwarsdoorsnede"
      }
    ]
  },
  culvert: {
    rows: [
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "2"
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "8"
      },
      {
        keyName: "Hoogte",
        attrName: "height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.5"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | truncate: 20",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | truncate: 20",
        valueSuffix: "",
        defaultValue: "rechthoekig"
      }
    ]
  },
  levee: {
    rows: [
      {
        keyName: "Kruinhoogte",
        attrName: "crest_height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_height | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "2"
      },
      {
        keyName: "Bekleding",
        attrName: "coating",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.coating",
        valueSuffix: "",
        defaultValue: "gras"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material",
        valueSuffix: "",
        defaultValue: "zand"
      }
    ]
  },
  leveereferencepoint: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "Referentiemeetpunt"
      }
    ]
  },
  manhole: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "0-7361"
      },
      {
        keyName: "Maaiveld",
        attrName: "surface_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.42"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | lookupManholeShape",
        valueSuffix: "",
        defaultValue: "vierkant"
      },
      {
        keyName: "Putbodem",
        attrName: "bottom_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-1.6"
      }
    ],
  },
  measuringstation: {
    rows: [
      {
        keyName: "Categorie",
        attrName: "category",
        ngBindValue: "waterchain.layers.waterchain_grid.data.category",
        valueSuffix: "",
        defaultValue: "KNMI-AWS"
      },
      {
        keyName: "Frequentie",
        attrName: "frequency",
        ngBindValue: "waterchain.layers.waterchain_grid.data.frequency",
        valueSuffix: "",
        defaultValue: "1x per uur"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "6278"
      }
      /*
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "KNMI"
      }*/
    ]
  },
  orifice: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "3105"
      },
      {
        keyName: "Overstortbreedte",
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        keyName: "Overstorthoogte",
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.2"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | truncate: 20",
        valueSuffix: "",
        defaultValue: "rechthoekig"
      }
    ]
  },
  outlet: {
    rows: [
      {
        keyName: "Put ID",
        attrName: "manhole_id",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.manhole_id | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: "6-549"
      },
      {
        keyName: "Buitenwaterstand (gemiddeld)",
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_average | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.1"
      },
      {
        keyName: "Buitenwaterstand (zomer)",
        attrName: "open_water_level_summer",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_summer | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.05"
      },
      {
        keyName: "Buitenwaterstand (winter)",
        attrName: "open_water_level_winter",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_winter | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.15"
      }
    ]
  },
  overflow: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "12-72297"
      },
      {
        keyName: "Overstortbreedte",
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        keyName: "Overstorthoogte",
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level",
        valueSuffix: " (mNAP)",
        defaultValue: "0.2"
      }
    ]
  },
  pipe: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type | lookupPipeType",
        valueSuffix: "",
        defaultValue: "gemengd stelsel"
      },
      {
        keyName: "BOB beginpunt",
        attrName: "invert_level_start_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_start_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.1"
      },
      {
        keyName: "BOB eindpunt",
        attrName: "invert_level_end_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_end_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.12"
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "28"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | lookupPipeShape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "0-985-0-986"
      },
      {
        keyName: "Beginpunt",
        attrName: "start_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_point",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
      {
        keyName: "Eindpunt",
        attrName: "end_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.end_point",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
      // {
      //   keyName: "Aantal inwoners",
      //   attrName: "number_of_inhabitants",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.number_of_inhabitants",
      //   valueSuffix: "",
      //   defaultValue: "7"
      // },
      // {
      //   keyName: "DWA definitie",
      //   attrName: "dwa_definition",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.dwa_definition",
      //   valueSuffix: "",
      //   defaultValue: "DWA"
      // }
    ]
  },
  pumpstation_sewerage: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type | lookupPumpStationType",
        valueSuffix: "",
        defaultValue: "Gemaaltype onbekend"
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Afslagpeil",
        attrName: "stop_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.8"
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: " (m3/uur)",
        defaultValue: "54"
      },
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
    ]
  },
  pressure_pipe: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type | lookupPressurePipeType",
        valueSuffix: "",
        defaultValue: "transportleiding"
      },
      {
        keyName: "Bouwjaar",
        attrName: "year_of_construction",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.year_of_construction",
        valueSuffix: "",
        defaultValue: "2006"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "776"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      // {
      //   keyName: "Naam",
      //   attrName: "name",
      //   ngBindValue: "waterchain.layers.waterchain_grid.data.name",
      //   valueSuffix: "",
      //   defaultValue: "persleiding"
      // },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length",
        valueSuffix: " (m)",
        defaultValue: "154"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: "HDPE"
      },
      {
        keyName: "Diameter",
        attrName: "diameter",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.diameter | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      }
    ]
  },
  pumpstation_non_sewerage: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type | lookupPumpStationType",
        valueSuffix: "",
        defaultValue: "gemaal"
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.capacity * 3.6| niceNumberOrEllipsis: 2",
        valueSuffix: "  (m3/uur)",
        defaultValue: "54"
      },
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "127"
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Afslagpeil",
        attrName: "stop_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.8"
      }
    ]
  },
  pump: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: "Afslagpeil",
        attrName: "stop_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.capacity | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: ""
      },
    ]
  },
  pumped_drainage_area: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "Bemalingsgebied"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: ""
      }
    ]
  },
  sluice: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: " (mNAP)"
      }
    ]
  },
  waste_water_treatment_plant: {
    rows: [ //Afvalwaterzuiveringsinstallatie
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "Groote Lucht"
      },
    ]
  },
  weir: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "473"
      },
      {
        keyName: "Breedte",
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      },
      {
        keyName: "Niveau",
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.3"
      },
      {
        keyName: "Controle",
        attrName: "controlled",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.controlled",
        valueSuffix: "",
        defaultValue: "RTC"
      },
    ]
  }
});
