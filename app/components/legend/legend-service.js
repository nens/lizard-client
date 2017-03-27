angular.module('legend')
  .service('LegendService', [
  'DataService', 'UtilService', 'RasterService', 'State', '$q', '$http',
  function (DataService, UtilService, RasterService, State, $q, $http) {


    this.rasterData = { continuous: {}, discrete: {} };
    var activeCategories = {}; // Per discrete raster we keep track of the
                               // selected category, so we can show this for
                               // each legend.

    // TMP! ////////////////////////
    var that = this;
    window.dbgLegend = function () {
      console.log("[dbg] LegendService.rasterData:", that.rasterData);
    };

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
          colormapName = UtilService.extractColormapName(styles),
          singleColormapUrl = COLORMAP_URL + colormapName + "/";

      if (UtilService.isCompoundStyles(styles)) {
        styleParts = styles.split(":");
        styleMin = styleParts[1];
        styleMax = styleParts[2];
      }

      $http.get(singleColormapUrl).then(function (result) {
        var colormap = result.data.definition;
        colormaps[uuid] = colormap;
        var layer = _.find(State.layers, { uuid: uuid });
        if (layer && layer.active) {

          var contRasterData = this.rasterData.continuous[uuid];
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
          _.orderBy(obj.data, function (datum) {
            return datum.data;
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

    this.updateLegendData = function (bounds, layers) {
      var GEOMETRY;
      try {
        GEOMETRY = UtilService.lLatLngBoundsToGJ(bounds);
      } catch (e) {
        // On initial load, the arg called 'bounds' is not fit for deriving the
        // GEOMETRY constant used here.
        return;
      }

      var geo = {
        type: 'Feature',
        geometry: GEOMETRY
      };
      var options = {
        start: State.temporal.start,
        end: State.temporal.end,
        geom: GEOMETRY
      };
      var uuid,
          name,
          defer = $q.defer(),
          dataLayerObj,
          promises = [],
          contRasterData,
          styleParts;

      angular.forEach(layers, function (layerObj) {
        if (layerObj.type === 'raster') {
          name = layerObj.name;
          uuid = layerObj.uuid;
          if (layerObj.active) {
            dataLayerObj = _.find(DataService.dataLayers, { uuid: uuid });
            if (!dataLayerObj) { return; }
            this.uuidMapping[uuid] = name;
            if (rasterIsDiscrete(dataLayerObj)) {
              DataService.updateLayerData(geo, layerObj, options, promises);
            } else {
              console.log("[A]");
              contRasterData = this.rasterData.continuous[uuid];
              if (contRasterData === undefined) {
                console.log("[B]");
                this.initContinuousRasterData(uuid, dataLayerObj.unit);
              }
              if (!colormaps[uuid]) {
                console.log("[C]");
                this.setColormap(uuid, dataLayerObj.styles);
              } else {
                console.log("[D]");
                contRasterData.colormap = colormaps[uuid];
                if (!contRasterData.min && !contRasterData.max) {

                  if (UtilService.isCompoundStyles(dataLayerObj.styles)) {
                    console.log("[D1] dataLayerObj.styles =", dataLayerObj.styles);
                    styleParts = dataLayerObj.styles.split(":");
                    contRasterData.min = parseFloat(styleParts[1]);
                    contRasterData.max = parseFloat(styleParts[2]);
                  } else {
                    console.log("[D2]");
                    contRasterData.min = _.first(colormaps[uuid].data)[0];
                    contRasterData.max = _.last(colormaps[uuid].data)[0];
                  }
                }
              }
            }
          } else {
            this.deleteLegendData(uuid);
          }
        }
      }, this);

      if (promises.length > 0) {
        $q.all(promises).then(function () {
          geo.properties = geo.properties || {};
          defer.resolve(geo);
          defer = undefined; // Clear the defer
          this.setDiscreteRasterData(geo.properties);
        }.bind(this));
      }
    };
}]);
