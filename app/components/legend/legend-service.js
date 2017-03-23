angular.module('legend')
  .service('LegendService', [
  'DataService', 'UtilService', 'RasterService', 'State', '$q', '$http',
  function (DataService, UtilService, RasterService, State, $q, $http) {

    this.rasterData = {
      continuous: {},
      discrete: {},
      totalAreaOfGeometry: null
    };

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
      var dataLayerObj = _.find(DataService.dataLayers, {uuid: uuid});
      return dataLayerObj && dataLayerObj.temporal;
    };

    var rasterIsDiscrete = function (dataLayerObj) {
      return dataLayerObj.scale === "nominal" || dataLayerObj.scale === "ordinal";
    };

    this.setColormap = function (uuid, styles) {
      if (!COLORMAP_URL) {
        COLORMAP_URL = getColormapUrl();
      }
      var formattedStyles = UtilService.formatRasterStyles(styles);
      var singleColormapUrl = COLORMAP_URL + formattedStyles + "/";
      $http.get(singleColormapUrl).then(function (result) {
        var colormap = result.data.definition;
        colormaps[uuid] = colormap;
        var layer = _.find(State.layers, {uuid: uuid});
        if (layer && layer.active) {
          this.rasterData.continuous[uuid].colormap = colormap;
          if (this.rasterData.continuous[uuid].min === null) {
            this.rasterData.continuous[uuid].min = colormap.data[0][0];
          }
          if (this.rasterData.continuous[uuid].max === null) {
            this.rasterData.continuous[uuid].max = colormap.data[
              colormap.data.length - 1][0];
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

    this.updateLegendData = function (bounds, selectedGeometries, layers) {
      var boundsGJ;

      var options = {
        // XXX this is probably also set in updateLayerData.
        start: State.temporal.start,
        end: State.temporal.end
      };

      if (selectedGeometries && selectedGeometries.length == 1 &&
          selectedGeometries[0].geometry &&
          selectedGeometries[0].geometry.type === 'Polygon') {
        // If we have a selected region, base the legend on that.
        var selectedPolygon = selectedGeometries[0]
        boundsGJ = selectedPolygon.geometry;
        this.rasterData.totalAreaOfGeometry = selectedPolygon.area;

        options.boundaryType = selectedPolygon.regionType;  // "MUNICIPALITY", etc
        options.geomId = selectedPolygon.id;
      } else {
        try {
          boundsGJ = UtilService.lLatLngBoundsToGJ(bounds);

          // Getting area data over a leaflet bounds is too imprecise,
          // so by setting this to null the areas aren't shown.
          this.rasterData.totalAreaOfGeometry = null;

          options.geom = boundsGJ;
        } catch (e) {
          // On initial load, the arg called 'bounds' is not fit for deriving the
          // GEOMETRY constant used here.
          return;
        }
      }

      var defer = $q.defer();
      var dataLayerObj;
      var promises = [];
      var uuid;
      var name;

      var geo = {
        type: 'Feature',
        geometry: boundsGJ
      };

      angular.forEach(layers, function (layerObj) {
        if (layerObj.type === 'raster') {
          name = layerObj.name;
          uuid = layerObj.uuid;
          if (layerObj.active) {
            dataLayerObj = _.find(DataService.dataLayers, {uuid: uuid});
            if (!dataLayerObj) {
              return;
            }
            if (typeof(dataLayerObj.styles) === 'object') {
              // NB! Compound values for raster "styles" option (currently only
              // in place for rain), as opposed to a single string, imply we
              // don't want to draw legend data.
              return;
            }
            this.uuidMapping[uuid] = name;
            if (rasterIsDiscrete(dataLayerObj)) {
              DataService.updateLayerData(geo, layerObj, options, promises);
            } else {
              if (this.rasterData.continuous[uuid] === undefined) {
                this.initContinuousRasterData(uuid, dataLayerObj.unit);
              }
              if (!colormaps[uuid]) {
                // IF colormap for the current layer isn't already defined,
                // retrieve it via the API's colormaps endpoint:
                this.setColormap(uuid, dataLayerObj.styles);
              } else {
                // ELSE, retrieve it from local dict:
                this.rasterData.continuous[uuid].colormap = colormaps[uuid];
                this.rasterData.continuous[uuid].min =
                  this.rasterData.continuous[uuid].min || colormaps[uuid].data[0][0];
                this.rasterData.continuous[uuid].max =
                  this.rasterData.continuous[uuid].max ||colormaps[uuid].data[
                    colormaps[uuid].data.length - 1][0];
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
