angular.module('lizard-nxt')
  .constant("WantedAttributes", {
  bridge: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.waterchain_grid.data.type",
        valueSuffix: ""
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Hoogte",
        attrName: "height",
        ngBindValue:
          "waterchain.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      }
    ]
  },
  channel: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.waterchain_grid.data.type | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
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
          "waterchain.waterchain_grid.data.type | niceNumberOrEllipsis: 2",
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
          "waterchain.waterchain_grid.data.type | truncate: 20",
        valueSuffix: ""
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      }
    ]
  },
  levee: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.waterchain_grid.data.type | lookupLeveeType",
        valueSuffix: ""
      },
      {
        keyName: "Kruinhoogte",
        attrName: "crest_height",
        ngBindValue:
          "waterchain.waterchain_grid.data.crest_height | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.waterchain_grid.data.material",
        valueSuffix: " m"
      },
      {
        keyName: "Coating",
        attrName: "coating",
        ngBindValue:
          "waterchain.waterchain_grid.data.coating",
        valueSuffix: " m"
      },
      {
        keyName: "Kruinhoogte",
        attrName: "crest_height",
        ngBindValue:
          "waterchain.waterchain_grid.data.crest_height | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Risico",
        attrName: "recurrence_time",
        ngBindValue:
          "waterchain.waterchain_grid.data.recurrence_time | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      }
    ]
  },
  leveereferencepoint: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.waterchain_grid.data.type | lookupLeveeReferencePointType",
        valueSuffix: ""
      }
    ]
  },
  manhole: {
    rows: [
      {
        keyName: "Maaiveld",
        attrName: "surface_level",
        ngBindValue:
          "waterchain.waterchain_grid.data.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: " m NAP"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.waterchain_grid.data.shape | lookupManholeShape",
        valueSuffix: ""
      },
      {
        keyName: "Putbodem",
        attrName: "bottom_level",
        ngBindValue:
          "waterchain.waterchain_grid.data.bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: " m NAP"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.waterchain_grid.data.material | lookupManholeMaterial",
        valueSuffix: ""
      }
    ],
  },
  measuringstation: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.waterchain_grid.data.name",
        valueSuffix: ""
      },
      {
        keyName: "Regio",
        attrName: "region",
        ngBindValue: "waterchain.waterchain_grid.data.region",
        valueSuffix: ""
      },
      {
        keyName: "Categorie",
        attrName: "category",
        ngBindValue: "waterchain.waterchain_grid.data.category",
        valueSuffix: ""
      },
      {
        keyName: "Frequentie",
        attrName: "frequency",
        ngBindValue: "waterchain.waterchain_grid.data.frequency",
        valueSuffix: ""
      }
    ]
  },
  /*orifice: { // NB! The info table needs more data:
   * "lengte * breedte" is undefined atm.
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
        keyName: "Buitenwaterstand",
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.waterchain_grid.data.open_water_level_average | niceNumberOrEllipsis: 2",
        valueSuffix: " m NAP"
      }
    ]
  },
  overflow: {
    rows: [
      {
        keyName: "Overstortbreedte",
        attrName: "crest_width",
        ngBindValue:
          "waterchain.waterchain_grid.data.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Overstorthoogte",
        attrName: "crest_level",
        ngBindValue:
          "waterchain.waterchain_grid.data.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " m NAP"
      }
    ]
  },
  pipe: {
    rows: [
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.waterchain_grid.data.shape | lookupPipeShape",
        valueSuffix: ""
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.waterchain_grid.data.material | pipeMaterialOrEllipsis",
        valueSuffix: ""
      }
    ]
  },
  pumpstation_sewerage: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.waterchain_grid.data.name",
        valueSuffix: ""
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " m boven NAP"
      },
      {
        keyName: "Afslagpeil",
        attrName: "stop_level",
        ngBindValue:
          "waterchain.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " m boven NAP"
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.waterchain_grid.data.capacity | niceNumberOrEllipsis: 2",
        valueSuffix: " l/s"
      }
    ]
  },
  pumpstation_non_sewerage: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue: "waterchain.waterchain_grid.data.name",
        valueSuffix: ""
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " m boven NAP"
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.waterchain_grid.data.capacity | niceNumberOrEllipsis: 2",
        valueSuffix: " l/s"
      }
    ]
  },
  sluice: {
    rows: [
      {
        keyName: "Naam",
        attrName: "name",
        ngBindValue:
          "waterchain.waterchain_grid.data.name",
        valueSuffix: " m NAP"
      }
    ]
  },
  weir: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.waterchain_grid.data.type",
        valueSuffix: ""
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue: "waterchain.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      },
      {
        keyName: "Hoogte",
        attrName: "height",
        ngBindValue: "waterchain.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " m"
      }
    ]
  }
});
