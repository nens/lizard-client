angular.module('legend')
  .service('LegendService', [
  'DataService', 'UtilService', 'RasterService', 'State', '$q', '$http',
  function (DataService, UtilService, RasterService, State, $q, $http) {

    this.rasterData = {
      continuous: {},
      discrete: {}
    };

    this.uuidMapping = {}; // dict for getting the name when having the uuid

    var self = this;
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

    var resetContinuousRasterData = function (uuid) {
      if (self.rasterData.continuous[uuid] === undefined) {
        self.rasterData.continuous[uuid] = {
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

    var setColormap = function (name, styles) {
      if (!COLORMAP_URL) {
        COLORMAP_URL = getColormapUrl();
      }
      $http.get(COLORMAP_URL + styles + "/").then(function (result) {
        colormaps[name] = result.data.definition;
        self.rasterData.continuous[name].colormap = result.data.definition;
      });
    };

    var responseIsEmpty = function (data) {
      return data.length === 1 && data[0] === null;
    };

    var setDiscreteRasterData = function (geoProperties) {
      var raster;
      angular.forEach(geoProperties, function (obj, uuid) {
        raster = uuid;
        if (!responseIsEmpty(obj.data)) {
          _.orderBy(obj.data, function (datum) {
            return datum.data;
          });
          self.rasterData.discrete[raster] = obj.data;
        } else {
          self.rasterData.discrete[raster] = undefined;
        }
      });
    };

    var updateContinuousRasterData = function (uuid, dataLayerObj, options) {

      self.rasterData.continuous[uuid].unit = dataLayerObj.unit;

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
          self.rasterData.continuous[uuid].min = floatRound(minData.data, 3);
        } else {
          self.rasterData.continuous[uuid].min = null;
        }
      });

      apiCallOptions.agg = 'max';
      var maxPromise = RasterService.getData(apiCallOptions);
      maxPromise.then(function (maxData) {
        console.log("maxData from server:", maxData.data);
        if (maxData.data !== null) {
          self.rasterData.continuous[uuid].max = floatRound(maxData.data, 3);
        } else {
          self.rasterData.continuous[uuid].max = null;
        }
      });
    };

    var deleteLegendData = function (uuid) {
      delete self.rasterData.discrete[uuid];
      delete self.rasterData.continuous[uuid];
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
            if (!dataLayerObj || dataLayerObj.temporal) {
              return;
            }
            this.uuidMapping[uuid] = name;
            if (rasterIsDiscrete(dataLayerObj)) {
              DataService.updateLayerData(geo, layerObj, options, promises);
            } else {
              resetContinuousRasterData(uuid);
              if (!colormaps[name]) {
                // IF colormap for the current layer ain't already defined,
                // retrieve it via the API's colormaps endpoint:
                setColormap(uuid, dataLayerObj.styles);
              } else {
                // ELSE, retrieve it from local dict:
                self.rasterData.continuous[uuid].colormap = colormaps[uuid];
              }
              updateContinuousRasterData(uuid, dataLayerObj, options);
            }
          } else {
            deleteLegendData(uuid);
          }
        }
      }, this);

      if (promises.length > 0) {
        $q.all(promises).then(function () {
          geo.properties = geo.properties || {};
          defer.resolve(geo);
          defer = undefined; // Clear the defer
          setDiscreteRasterData(geo.properties);
        });
      }

      return self.rasterData;
    };
}]);
