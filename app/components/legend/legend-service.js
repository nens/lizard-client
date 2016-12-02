angular.module('legend')
  .service('LegendService', [
  'DataService', 'UtilService', 'RasterService', 'State', '$q', '$http',
  function (DataService, UtilService, RasterService, State, $q, $http) {

    this.rasterData = {
      continuous: {},
      discrete: {}
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

    var floatRound = function (r, decimalCount) {
      var d = decimalCount === undefined ? 0 : decimalCount;
      var multiplier = Math.pow(10, d);
      return Math.round(r * multiplier) / multiplier;
    };

    var getColormapUrl = function () {
      var url = window.location.protocol
        + '//' + window.location.host
        + '/api/v2/colormaps/';
      return url.replace("9000", "8000"); // Applicable for dev environment only..
    };

    this.resetContinuousRasterData = function (uuid) {
      if (this.rasterData.continuous[uuid] === undefined) {
        this.rasterData.continuous[uuid] = {
          min: null,
          max: null,
          unit: null,
          colormap: colormaps[uuid] || null
        };
      }
    };

    var rasterIsDiscrete = function (dataLayerObj) {
      return dataLayerObj.scale === "nominal" || dataLayerObj.scale === "ordinal";
    };

    this.setColormap = function (name, styles) {
      if (!COLORMAP_URL) {
        COLORMAP_URL = getColormapUrl();
      }
      $http.get(COLORMAP_URL + styles + "/").then(function (result) {
        colormaps[name] = result.data.definition;
        this.rasterData.continuous[name].colormap = result.data.definition;
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

    this.updateContinuousRasterData = function (uuid, dataLayerObj, options) {

      this.rasterData.continuous[uuid].unit = dataLayerObj.unit;

      // Merging two objects without altering one or both:
      var apiCallOptions = {};
      angular.forEach(dataLayerObj, function (v, k) {
        apiCallOptions[k] = v;
      });
      angular.forEach(options, function (v, k) {
        apiCallOptions[k] = v;
      });

      apiCallOptions.agg = 'min';
      var minPromise = RasterService.getData(apiCallOptions);
      minPromise.then(function (minData) {
        // console.log("data:", minData);
        if (minData.data !== null) {
          console.log("minData from server:", minData.data);
          this.rasterData.continuous[uuid].min = floatRound(minData.data, 3);
        } else {
          this.rasterData.continuous[uuid].min = null;
        }
      }.bind(this));

      apiCallOptions.agg = 'max';
      var maxPromise = RasterService.getData(apiCallOptions);
      maxPromise.then(function (maxData) {
        console.log("maxData from server:", maxData.data);
        if (maxData.data !== null) {
          this.rasterData.continuous[uuid].max = floatRound(maxData.data, 3);
        } else {
          this.rasterData.continuous[uuid].max = null;
        }
      }.bind(this));
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

      var defer = $q.defer();
      var dataLayerObj;
      var promises = [];
      var geo = {
        type: 'Feature',
        geometry: GEOMETRY
      };
      var options = {
        start: State.temporal.start,
        end: State.temporal.end,
        geom: GEOMETRY
      };
      var uuid;
      var name;

      angular.forEach(layers, function (layerObj) {
        if (layerObj.type === 'raster') {
          name = layerObj.name;
          uuid = layerObj.uuid;
          if (layerObj.active) {
            dataLayerObj = _.find(DataService.dataLayers, {uuid: uuid});
            if (!dataLayerObj) {
              return;
            }
            this.uuidMapping[uuid] = name;
            if (rasterIsDiscrete(dataLayerObj)) {
              DataService.updateLayerData(geo, layerObj, options, promises);
            } else {
              this.resetContinuousRasterData(uuid);
              if (!colormaps[name]) {
                // IF colormap for the current layer ain't already defined,
                // retrieve it via the API's colormaps endpoint:
                this.setColormap(uuid, dataLayerObj.styles);
              } else {
                // ELSE, retrieve it from local dict:
                this.rasterData.continuous[uuid].colormap = colormaps[uuid];
              }
              this.updateContinuousRasterData(uuid, dataLayerObj, options);
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
