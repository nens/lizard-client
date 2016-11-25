angular.module('legend')
  .service('LegendService', [
  'DataService', 'UtilService', 'RasterService', 'State', '$q', '$http',
  function (DataService, UtilService, RasterService, State, $q, $http) {

    this.rasterData = {
      continuous: {},
      discrete: {}
    };

    var self = this;
    var uuidMapping = {}; // dict for getting the name when having the uuid
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

    var resetContinuousRasterData = function (name) {
      if (self.rasterData.continuous[name] === undefined) {
        self.rasterData.continuous[name] = {
          min: null,
          max: null,
          unit: null,
          colormap: colormaps[name] || null
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
      var rasterName;
      angular.forEach(geoProperties, function (obj, uuid) {
        rasterName = uuidMapping[uuid];
        if (!responseIsEmpty(obj.data)) {
          _.orderBy(obj.data, function (datum) {
            return datum.data;
          });
          self.rasterData.discrete[rasterName] = obj.data;
        } else {
          self.rasterData.discrete[rasterName] = undefined;
        }
      });
    };

    var updateContinuousRasterData = function (name, dataLayerObj, options) {

      self.rasterData.continuous[name].unit = dataLayerObj.unit;

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
          self.rasterData.continuous[name].min = floatRound(minData.data, 3);
        } else {
          self.rasterData.continuous[name].min = null;
        }
      });

      apiCallOptions.agg = 'max';
      var maxPromise = RasterService.getData(apiCallOptions);
      maxPromise.then(function (maxData) {
        // console.log("data:", maxData);
        if (maxData.data !== null) {
          self.rasterData.continuous[name].max = floatRound(maxData.data, 3);
        } else {
          self.rasterData.continuous[name].max = null;
        }
      });
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
            uuidMapping[uuid] = name;
            if (rasterIsDiscrete(dataLayerObj)) {
              DataService.updateLayerData(geo, layerObj, options, promises);
            } else {
              resetContinuousRasterData(name);
              if (!colormaps[name]) {
                // IF colormap for the current layer ain't already defined,
                // retrieve it via the API's colormaps endpoint:
                setColormap(name, dataLayerObj.styles);
              } else {
                // ELSE, retrieve it from local dict:
                self.rasterData.continuous[name].colormap = colormaps[name];
              }
              updateContinuousRasterData(name, dataLayerObj, options);
            }
          } else {
            delete self.rasterData.discrete[name];
            delete self.rasterData.continuous[name];
          }
        }
      });

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