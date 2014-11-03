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
  channel: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: " (m)",
        defaultValue: "hoofdwatergang"
      },
      {
        keyName: "bed_level",
        attrName: "bed_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.bed_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "talud_left",
        attrName: "talud_left",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.talud_left",
        valueSuffix: "",
        defaultValue: "1:2"
      },
      {
        keyName: "talud_right",
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
        defaultValue: ""
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
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material",
        valueSuffix: "",
        defaultValue: "zand"
      },
      {
        keyName: "Coating",
        attrName: "coating",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.coating",
        valueSuffix: "",
        defaultValue: "gras"
      },
      {
        keyName: "Kruinhoogte",
        attrName: "crest_height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "2"
      }
    ]
  },
  leveereferencepoint: {
    rows: []
  },
  manhole: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: " (m NAP)",
        defaultValue: "0-7361"
      },
      {
        keyName: "Maaiveld",
        attrName: "surface_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "0.5"
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
        valueSuffix: " (m NAP)",
        defaultValue: "-1.6"
      }
    ],
  },
  measuringstation: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "6278"
      },
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "KNMI"
      },
      {
        keyName: "Regio",
        attrName: "region",
        ngBindValue: "waterchain.layers.waterchain_grid.data.region",
        valueSuffix: "",
        defaultValue: "AWS"
      },
      {
        keyName: "Categorie",
        attrName: "category",
        ngBindValue: "waterchain.layers.waterchain_grid.data.category",
        valueSuffix: "",
        defaultValue: "KNMI_AWS"
      },
      {
        keyName: "Frequentie",
        attrName: "frequency",
        ngBindValue: "waterchain.layers.waterchain_grid.data.frequency",
        valueSuffix: "",
        defaultValue: "1x per uur"
      }
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
        valueSuffix: " (m NAP)",
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
        valueSuffix: " (m NAP)",
        defaultValue: "-0.1"
      },
      {
        keyName: "Buitenwaterstand (zomer)",
        attrName: "open_water_level_summer",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_summer | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-0.05"
      },
      {
        keyName: "Buitenwaterstand (winter)",
        attrName: "open_water_level_winter",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_winter | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
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
        valueSuffix: " (m NAP)",
        defaultValue: "0.2"
      },
      {
        keyName: "Buitenwaterstand (gemiddeld)",
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_average | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-0.1"
      },
      {
        keyName: "Buitenwaterstand (zomer)",
        attrName: "open_water_level_summer",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_summer | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-0.05"
      },
      {
        keyName: "Buitenwaterstand (winter)",
        attrName: "open_water_level_winter",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_winter | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-0.15"
      }
    ]
  },
  pipe: {
    rows: [
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
        defaultValue: "0-985"
      },
      {
        keyName: "Eindpunt",
        attrName: "end_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.end_point",
        valueSuffix: "",
        defaultValue: "0-986"
      },
      {
        keyName: "invert_level_start_point",
        attrName: "invert_level_start_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_start_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-3.1"
      },
      {
        keyName: "invert_level_end_point",
        attrName: "invert_level_end_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_end_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
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
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "gemengd stelsel"
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
        keyName: "Aantal inwoners",
        attrName: "number_of_inhabitants",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.number_of_inhabitants",
        valueSuffix: "",
        defaultValue: "7"
      },
      {
        keyName: "DWA definitie",
        attrName: "dwa_definition",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.dwa_definition",
        valueSuffix: "",
        defaultValue: "DWA"
      }
    ]
  },
  pumpstation_sewerage: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "Rioolgemaal"
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Afslagpeil",
        attrName: "stop_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-2.8"
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.capacity | niceNumberOrEllipsis: 2",
        valueSuffix: " (m^3 p/uur)",
        defaultValue: "54"
      }
    ]
  },
  pressure_pipe: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "persleiding"
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
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length",
        valueSuffix: " (m)",
        defaultValue: "154"
      },
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "transportleiding"
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
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      {
        keyName: "Bouwjaar",
        attrName: "year_of_construction",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.year_of_construction",
        valueSuffix: "",
        defaultValue: "2006"
      }
    ]
  },
  pumpstation_non_sewerage: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "gemaal"
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
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "gemaal"
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Afslagpeil",
        attrName: "stop_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (m NAP)",
        defaultValue: "-2.8"
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.capacity | niceNumberOrEllipsis: 2",
        valueSuffix: "  (m^3 p/uur)",
        defaultValue: "54"
      }
    ]
  },
  pump: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.name",
        valueSuffix: "",
        defaultValue: "Gemaalpomp"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: "Displaynaam",
        attrName: "display_name",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: ""
      },
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
      }
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
        valueSuffix: " (m NAP)"
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
        valueSuffix: " (m NAP)",
        defaultValue: "-0.3"
      },
      {
        keyName: "Controlle",
        attrName: "controlled",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.controlled",
        valueSuffix: "",
        defaultValue: "RTC"
      },
    ]
  }
});
