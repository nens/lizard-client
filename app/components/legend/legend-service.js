angular.module('legend')
  .service('LegendService', [
  'DataService', 'UtilService', 'RasterService', 'State', '$q', '$http',
  function (DataService, UtilService, RasterService, State, $q, $http) {

    /* COMMENT CONCERING MIN/MAX FOR CONTINUOUS RASTERS (d.d. 18-04-2017):

    Continuous rasters can now handle the following 4 formats for the "styles"
    option, as configurable in the Django admin:

    1) "styles": "dem_nl"
    2) "styles": "dem_nl:[MIN]:[MAX]"
    3) "styles": {"0":
                   {"0": "radar-5min",
                    "3600000": "radar-hour",
                    "86400000": "radar-day"}
                  ...
                 }
    4) "styles": {"0":
                   {"0": "radar-5min:[MIN]:[MAX]",
                    "3600000": "radar-hour:[MIN]:[MAX]",
                    "86400000": "radar-day:[MIN]:[MAX]"}
                  ...
                 }

      In the case (1) and (3), the (normalized) MIN and MAX values used for the
      legend are retrieved from the colormaps API endpoint, while in case (2)
      and (4) they are readily available in the frontend.

      TODO: extract all things "styles" related to a sepecrate class!
     */


    this.rasterData = {
      continuous: {},
      discrete: {},
      totalAreaOfGeometry: null
    };

    this.rasterData = { continuous: {}, discrete: {} }; // why is rasterData defined twice?
    this.wmsData = { wms: {}};
    var activeCategories = {}; // Per discrete raster we keep track of the
                               // selected category, so we can show this for
                               // each legend.

    this.setActiveCategory = function (uuid, category) {
      var layer = _.find(State.layers, {uuid: uuid});
      var newCategory = null;
      if (layer) {
        if (layer.category !== category) {
          newCategory = category;
        }
        layer.category = newCategory;
      }
      activeCategories[uuid] = newCategory;
    };

    this.getActiveCategory = function (uuid) {
      return activeCategories[uuid];
    };

    this.uuidMapping = {}; // dict for getting the name when having the uuid
    this.uuidOrganisationMapping = {};
    var colormaps = {}; // dict for saving colormaps locally
    var COLORMAP_URL; // constant containing the colormap endpoint URL

    var getColormapUrl = function () {
      var url = window.location.protocol
        + '//' + window.location.host
        + '/api/v3/colormaps/';
      return url;
    };

    this.initContinuousRasterData = function (uuid, unit) {
      this.rasterData.continuous[uuid] = {
        min: null,
        max: null,
        unit: unit,
        colormap: null
      };
    };

    this.initWmsData = function (uuid, unit) {
      this.wmsData.wms[uuid] = {
        legendUrl: ''
      };
    };

    this.rasterIsTemporal = function (uuid) {
      var dataLayerObj = _.find(DataService.dataLayers, { uuid: uuid });
      return dataLayerObj && dataLayerObj.temporal;
    };

    var rasterIsDiscrete = function (dataLayerObj) {
      return _.includes(["nominal", "ordinal"], dataLayerObj.scale);
    };

    this.setColormap = function (uuid, styles) {

      if (!COLORMAP_URL) { COLORMAP_URL = getColormapUrl(); }

      var styleMin,
          styleMax,
          styleParts,
          stylesString = UtilService.extractStylesString(
            styles, State.temporal.aggWindow),
          colormap,
          colormapName = UtilService.extractColormapName(stylesString),
          layer,
          contRasterData,
          singleColormapUrl = COLORMAP_URL + colormapName + "/";

      if (UtilService.isCompoundStyles(stylesString)) {
        styleParts = stylesString.split(":");
        styleMin = styleParts[1];
        styleMax = styleParts[2];
      }

      $http.get(singleColormapUrl).then(function (result) {
        colormap = result.data.definition;
        colormaps[uuid] = colormap;
        layer = _.find(State.layers, { uuid: uuid });
        if (layer && layer.active) {
          contRasterData = this.rasterData.continuous[uuid];
          contRasterData.colormap = colormap;
          if (contRasterData.min === null) {
            if (styleMin === undefined) {
              contRasterData.min = _.first(colormap.data)[0];
            } else {
              contRasterData.min = parseFloat(styleMin);
            }
          }
          if (contRasterData.max === null) {
            if (styleMax === undefined) {
              contRasterData.max = _.last(colormap.data)[0];
            } else {
              contRasterData.max = parseFloat(styleMax);
            }
          }
        }
      }.bind(this));
    };

    var responseIsEmpty = function (data) {
      return data.length === 1 && data[0] === null;
    };

    this.setDiscreteRasterData = function (geoProperties) {
      var raster;
      angular.forEach(geoProperties, function (obj, uuid) {
        raster = uuid;
        if (!responseIsEmpty(obj.data)) {
          console.log(obj.data);// also wms in here? no, just elements in raster legend
          _.orderBy(obj.data, function (datum) {
            return datum.data;
          });

          var totalArea = this.rasterData.totalAreaOfGeometry;
          _.forEach(obj.data, function (datum) {
            if (!totalArea) {
              datum.areaHa = null;
            } else {
              var pixels = datum.data;
              var totalPixels = datum.total;

              if (!pixels || !totalPixels) {
                datum.areaHa = 0;
              } else {
                datum.areaHa = Math.round((pixels/totalPixels) * totalArea / 10000);
              }
            }
          });

          this.rasterData.discrete[raster] = obj.data;
        } else {
          this.rasterData.discrete[raster] = undefined;
        }
      }, this);
    };

    this.deleteLegendData = function (uuid) {
      delete this.rasterData.discrete[uuid];
      delete this.rasterData.continuous[uuid];
    };
    this.deleteWmsLegendData = function (uuid) {
      delete this.wmsData.wms[uuid];//?
    };

    this.updateLegendData = function (bounds, selectedGeometries, layers) {
      // wms layer not properly updated
      console.log(layers);
      var boundsGJ;

      var options = {
        // XXX this is probably also set in updateLayerData.
        start: State.temporal.start,
        end: State.temporal.end
      };

      if (selectedGeometries && selectedGeometries.length === 1 &&
          selectedGeometries[0].geometry &&
          (selectedGeometries[0].geometry.type === 'Polygon' ||
           selectedGeometries[0].geometry.type === 'MultiPolygon')) {
        // If we have a selected region, base the legend on that.
        var selectedPolygon = selectedGeometries[0];
        boundsGJ = selectedPolygon.geometry;
        this.rasterData.totalAreaOfGeometry = selectedPolygon.area;

        options.boundary_type = selectedPolygon.regionType;  // "MUNICIPALITY", etc
        options.id = selectedPolygon.id;
      } else {
        try {
          boundsGJ = UtilService.lLatLngBoundsToGJ(bounds);
          // Getting area data over a leaflet bounds is too imprecise,
          // so by setting this to null the areas aren't shown.
          this.rasterData.totalAreaOfGeometry = null;
          options.geom = boundsGJ;
        } catch (e) {
          // On initial load, the arg called 'bounds' is not fit for deriving
          // the value for options.geom
          return;
        }
      }

      var geo = {
        type: 'Feature',
        geometry: boundsGJ
      };

      // console.log(layers); // legendUrl is here
      var uuid,
          name,
          defer = $q.defer(),
          dataLayerObj,
          promises = [],
          contRasterData,
          stylesString,
          styleParts,
          rasterLayers = _.filter(layers, { type: 'raster' }),
          wmsLayers = _.filter(layers, { type: 'wmslayer' });
      // console.log(rasterLayers);
      console.log(wmsLayers); // has legendUrl // wmslayer-directive # 39 has legend_url

      angular.forEach(rasterLayers, function (layerObj) {//how to implement for wms? is other foreach
        // console.log(layerObj);
        name = layerObj.name;
        uuid = layerObj.uuid;
        if (layerObj.active) {
          dataLayerObj = _.find(DataService.dataLayers, { uuid: uuid });
          if (!dataLayerObj) { return; }
          this.uuidMapping[uuid] = name;
          this.uuidOrganisationMapping[uuid] =  dataLayerObj.organisation && dataLayerObj.organisation.name;
          if (rasterIsDiscrete(dataLayerObj)) {
            DataService.updateLayerData(geo, layerObj, options, promises);
          } else {
            contRasterData = this.rasterData.continuous[uuid];
            if (contRasterData === undefined) {
              this.initContinuousRasterData(uuid, dataLayerObj.unit);
              contRasterData = this.rasterData.continuous[uuid];
            }
            if (!colormaps[uuid]) {
              this.setColormap(uuid, dataLayerObj.styles);
            } else {
              contRasterData.colormap = colormaps[uuid];
              if (!contRasterData.min && !contRasterData.max) {
                stylesString = UtilService.extractStylesString(
                  dataLayerObj.styles,
                  State.temporal.aggWindow);
                if (UtilService.isCompoundStyles(stylesString)) {
                  styleParts = stylesString.split(":");
                  contRasterData.min = parseFloat(styleParts[1]);
                  contRasterData.max = parseFloat(styleParts[2]);
                } else {
                  contRasterData.min = _.first(colormaps[uuid].data)[0];
                  contRasterData.max = _.last(colormaps[uuid].data)[0];
                }
              }
            }
          }
        } else {
          this.deleteLegendData(uuid);
        }
      }, this);

      angular.forEach(wmsLayers, function (layerObj) {
        // console.log(layerObj);//has legendUrl
        name = layerObj.name;
        uuid = layerObj.uuid;
        var legendUrl = layerObj.legendUrl;
        // console.log(legendUrl);//legendUrl
        // // conso
        if (layerObj.active) {
          dataLayerObj = _.find(DataService.dataLayers, { uuid: uuid });
          console.log(dataLayerObj); // legendUrl
          // if (uuid) {this.deleteWmsLegendData(uuid)};
          if (!dataLayerObj) { return; }
          this.uuidMapping[uuid] = name;
          this.uuidOrganisationMapping[uuid] =  dataLayerObj.organisation && dataLayerObj.organisation.name;
        //   // if (rasterIsDiscrete(dataLayerObj)) {
          // DataService.updateLayerData(geo, layerObj, options, promises);
          this.wmsData.wms = dataLayerObj;
        //   // }
        } else {
          this.deleteWmsLegendData(uuid);
          this.wmsData.wms = {};
        }
      }, this);

      // Commenting out the if-statement below removes raven messages (errors) in console.log
      // if (promises.length > 0) {
      //   $q.all(promises).then(function () {
      //     geo.properties = geo.properties || {};
      //     defer.resolve(geo);
      //     defer = undefined; // Clear the defer
      //     this.setDiscreteRasterData(geo.properties);
      //   }.bind(this));
      // }

    };
}]);
