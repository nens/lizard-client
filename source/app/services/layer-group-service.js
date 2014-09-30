
/**
 * @ngdoc service
 * @class LayerGroup
 * @memberof app
 * @name LayerGroup
 * @summary LayerGroup abstracts the notion of layers out of the app.
 * @description Only layergroups are approachable, from the outside world LayerGroup
 *              defines a group of layers which are loaded at initialization of the
 *              page. They can be toggled on/off and queried for data. Layergroup
 *              draws all its layers and returns data for all layers.
 */
app.factory('LayerGroup', [
  'VectorService', 'RasterService', 'LeafletService', 'UtfGridService', '$q',
  function (VectorService, RasterService, LeafletService, UtfGridService, $q) {

  // app.factory('LayerGroup', [
  //   'LeafletService', '$q',
  //   function (LeafletService, $q) {

    ///////////////////////////////////////////////////////////////////////////
    // This constant declares which keys (for LayerGroup instances) shall have
    // writable values; by default every value is read-only.
    var MUTABLE_KEYS = ['active', 'layers'];

    ///////////////////////////////////////////////////////////////////////////
    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and
     *              non-configurable properties
     * @param  {object} layergroup definition
     */
    function LayerGroup(layerGroup) {

      angular.forEach(layerGroup, function (value, key) {
        Object.defineProperty(this, '_' + key, {
          value: value,
          write: (key in MUTABLE_KEYS),
          configurable: true,
          enumerable: false
        });
      });
    }

    LayerGroup.prototype = {

      constructor: LayerGroup,

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description - Returns a promise that notifies with data for every layer
      *                of the layergroup that is appplicable (i.e: rain and several
      *                vector layers). It resolves when all data is in.
      * @param  {object} geom - latLng object with lat and lng properties or a list of
      *                         such objects.
      * @return  {promise} - notifies with data per layer and resolves when all layers
      *                      returned data.
      */
      getData: function (geom) {

        var deferred = $q.defer(); //

        if (!this._active) { deferred.resolve(false); }

        var promiseCount = 0;

        angular.forEach(this._layers, function (layer) {
          var wantedService;
          if (layer.type === 'Vector') {
            wantedService = VectorService;
          } else if (layer.type === 'Store') {
            wantedService = RasterService;
          } else if (layer.type === 'UTFGrid') {
            wantedService = UtfGridService;
          }
          promiseCount = buildPromise(layer, geom, deferred, wantedService, promiseCount);
        });

        return deferred.promise;
      },

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description
      */
      toggle: function (map, slug) {

        if (!this._initiated) {
          this._layers = _initiateLayers(this._layers);
          this._initiated = true;
        }

        // if (slug === this._slug) {
        //   this._active = !this._active;
        // }

        this._active = slug === this._slug;

        // if (this.baselayer && this._slug === 'elevation') {
        //   rescale(map);
        // }

        angular.forEach(this._layers, function (layer) {
          if (this._active) {
            addLayer(map, layer);
          } else {
            removeLayer(map, layer);
          }
        });
      },

      isActive: function () {
        return this._active;
      }
    };

    ///////////////////////////////////////////////////////////////////////////

    var buildPromise = function (layer, geom, deferred, wantedService, count) {

      var buildSuccesCallback = function (layer) {
        return function (data) {
          deferred.notify({data: data, type: layer.type});
          count--;
          if (count === 0) { deferred.resolve(true); }
        };
      };

      var buildErrorCallback = function (layer) {
        return function (msg) {
          deferred.notify({msg: msg, type: layer.type});
          count--;
          if (count === 0) { deferred.resolve(true); }
        };
      };

      var prom = wantedService.getData(geom, layer.slug);
      count++;
      prom.then(
        buildSuccesCallback(layer),
        buildErrorCallback(layer)
      );
      return count;
    };

    /**
     * @function
     * @memberof app.MapService
     * @param {L.Class} Leaflet layer.
     * @description Adds layer to map
     */
    var addLayer = function (map, layer) { // Leaflet Layer
      // Check if leaflet layer
      if (layer instanceof L.Class) {
        map.addLayer(layer);
      }
    };

    /**
     * @function
     * @memberof app.MapService
     * @param  {L.Class} Leaflet layer
     * @description Removes layer from map
     */
    var removeLayer = function (map, layer) { // Leaflet Layer
      // Check if leaflet layer
      if (layer instanceof L.Class) {
        map.removeLayer(layer);
      }
    };

    var _initiateLayers = function (layers) {

      angular.forEach(layers, function (layer) {

        switch (layer.type) {

          case 'Vector':
            _initiateVectorLayer(layer);
            break;

          case 'TMS':
            _initiateTMSLayer(layer);
            break;

          case 'WMS':
            _initiateWMSLayer(layer);
            break;

          case 'UTFGrid':
            _initiateGridLayer(layer);
            break;

          default:
            throw new Error(layer.type + ' is not a supported layer type');
        }
      });

      return layers;
    };


    var _initiateVectorLayer = function (nonLeafLayer) {

      if (nonLeafLayer._tiled) {

        // Initiate a tiled Vector layer

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        nonLeafLayer.leafletLayer = new LeafletService.TileDataLayer(url, {

          dataCallback: function (featureCollection, point) {

            if (!featureCollection) { return; }

            if (featureCollection.features.length > 0) {

              VectorService.setData(
                nonLeafLayer.slug,
                featureCollection.features,
                point.z
              );
            }
          },
          slug: nonLeafLayer.slug,
          ext: 'geojson'
        });

      } else {

        // Initiate (non-tiled) Vector layer, for e.g. events
        return;
      }
    };


    /**
     * @function
     * @memberof app.MapService
     * @param  {object} layer as served from backend
     * @return {L.TileLayer} leafletLayer
     * @description Initiates a Leaflet Tilelayer
     */
    var _initiateTMSLayer = function (nonLeafLayer) {

      var layerUrl = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';
      var layer = LeafletService.tileLayer(
        layerUrl, {
          name: (nonLeafLayer.baselayer) ? 'Background' : nonLeafLayer.slug,
          slug: nonLeafLayer.slug,
          minZoom: (nonLeafLayer.min_zoom) ? nonLeafLayer.min_zoom : 0,
          maxZoom: 19,
          detectRetina: true,
          zIndex: nonLeafLayer.z_index,
          ext: 'png'
        });

      nonLeafLayer.leafletLayer = layer;
      nonLeafLayer.initiated = true;
    };

    /**
     * @function
     * @memberof app.MapService
     * @param  {object} nonLeafLayer as served from backend
     * @return {L.TileLayer.WMS}              [description]
     * @description Initiates a Leaflet WMS layer
     */
    var _initiateWMSLayer = function (nonLeafLayer) {
      var _options = {
        layers: nonLeafLayer.slug,
        format: 'image/png',
        version: '1.1.1',
        minZoom: (nonLeafLayer.min_zoom) ? nonLeafLayer.min_zoom : 0,
        maxZoom: 19,
        zIndex: nonLeafLayer.z_index
      };

      if (nonLeafLayer.slug === 'landuse') {
        _options.styles = 'landuse';
      } else if (nonLeafLayer.slug === 'elevation') {
        _options.styles = 'BrBG_r';
        _options.effects = 'shade:0:3';
      } else if (nonLeafLayer.slug === 'isahw:BOFEK2012') {
        _options.styles = '';
        return; // Add no styling for soil layer
      } else { // Default, used by zettingsvloeiingsproef
        _options.styles = 'BrBG_r';
        _options.effects = 'shade:0:3';
      }

      nonLeafLayer.leafletLayer =
        LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
      nonLeafLayer.initiated = true;
    };

    /**
     * @function
     * @memberof app.MapService
     * @param  {object} nonLeafLayer as served from backend
     * @return {L.UtfGrid} utfgrid
     * @description Initiates layers that deliver interaction with the map
     */
    var _initiateGridLayer = function (nonLeafLayer) {

      var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

      var layer = new LeafletService.UtfGrid(url, {
        ext: 'grid',
        slug: nonLeafLayer.slug,
        name: nonLeafLayer.slug,
        useJsonP: false,
        minZoom: (nonLeafLayer.min_zoom_click) ?
          nonLeafLayer.min_zoom_click : 0,
        maxZoom: 19,
        order: nonLeafLayer.z_index,
        zIndex: nonLeafLayer.z_index
      });
      nonLeafLayer.leafletLayer = layer;
      nonLeafLayer.initiated = true;
    };

    ///////////////////////////////////////////////////////////////////////////

    return LayerGroup;
}]);
