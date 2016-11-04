angular.module('lizard-nxt')
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

    var getColormapUrl = function () {
      var url = window.location.protocol
        + '//' + window.location.host
        + '/api/v2/colormaps/';
      return url.replace("9000", "8000"); // Applicable for dev environment only..
    };

    var resetDiscreteRasterData = function (name) {
      self.rasterData.discrete[name] = {};
    };

    var resetContinuousRasterData = function (name) {
      self.rasterData.continuous[name] = {
        min: null,
        max: null,
        colormap: colormaps[name] || null
      };
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

    var setDiscreteRasterData = function (geoProperties) {
      var rasterName;
      angular.forEach(geoProperties, function (obj, uuid) {
        _.orderBy(obj.data, function (datum) {
          return datum.data;
        });
        rasterName = uuidMapping[uuid];
        self.rasterData.discrete[rasterName] = obj.data;
      });
    };

    var updateContinuousRasterData = function (name, dataLayerObj, options) {

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
        self.rasterData.continuous[name].min = minData.data;
      });

      apiCallOptions.agg = 'max';
      var maxPromise = RasterService.getData(apiCallOptions);
      maxPromise.then(function (maxData) {
        self.rasterData.continuous[name].max = maxData.data;
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
            uuidMapping[uuid] = name;
            if (rasterIsDiscrete(dataLayerObj)) {
              resetDiscreteRasterData(name);
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
    };
}]);