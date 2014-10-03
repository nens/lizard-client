
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
  'LeafletService', 'VectorService', 'RasterService', 'UtfGridService',
  'UtilService', '$q',
  function (LeafletService, VectorService, RasterService, UtfGridService,
    UtilService, $q) {

    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and
     *              non-configurable properties
     * @param  {object} layergroup definition
     */
    function LayerGroup(layerGroup) {
      Object.defineProperty(this, 'name', {
        value: layerGroup.name,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, 'order', {
        value: layerGroup.order,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, '_active', {
        value: false,
        writable: true,
        configurable: true,
        enumerable: false
      });
      Object.defineProperty(this, 'baselayer', {
        value: layerGroup.baselayer,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, 'slug', {
        value: layerGroup.slug,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, '_layers', {
        value: layerGroup.layers,
        writable: true,
        configurable: true,
        enumerable: false
      });
      Object.defineProperty(this, 'defaultActive', {
        value: layerGroup.active,
        writable: false,
        configurable: false,
        enumerable: false
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
      getData: function (geom, startTime, endTime) {

        var that = this,
            deferred = $q.defer();

        if (!this._active) { deferred.resolve(false); }

        var promiseCount = 0;

        angular.forEach(this._layers, function (layer) {

          var wantedService;

          if (layer.type === 'Store') {
            wantedService = RasterService;
          } else if (layer.type === 'UTFGrid') {
            wantedService = UtfGridService;
          } else if (layer.type === 'Vector') {
            wantedService = VectorService;
          } else {
            console.log('[E] someService.getData() was called w/o finding \'wantedService\' where wantedService =', wantedService);
          }

          if (wantedService) {

            promiseCount = buildPromise(
              that,
              layer,
              geom,
              startTime,
              endTime,
              deferred,
              wantedService,
              promiseCount
            );
          }
        });

        return deferred.promise;
      },

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description
      */
      toggle: function (map) {

        if (!this._initiated) {
          this._layers = _initiateLayers(this._layers, this.temporal);
          this._initiated = true;
        }

        this._active = !this._active;

        var fn = this._active ? addLayer : removeLayer;

        angular.forEach(this._layers, function (layer) {
          if (layer.leafletLayer) {
            fn(map, layer.leafletLayer);
          }
        });
      },

      isActive: function () {
        return this._active;
      }
    };

    ///////////////////////////////////////////////////////////////////////////

    var buildPromise = function (
      layerGroup,
      layer,
      geom,
      start,
      end,
      deferred,
      wantedService,
      count) {

      var prom, buildSuccesCallback, buildErrorCallback;

      buildSuccesCallback = function (layer) {

        return function (data) {

          deferred.notify({
            data: data,
            type: layer.type,
            layerGroupSlug: layerGroup.slug,
            layerSlug: layer.slug
          });

          if (--count === 0) { deferred.resolve(true); }
        };
      };

      buildErrorCallback = function (layer) {

        return function (msg) {

          deferred.notify({
            msg:  msg,
            type: layer.type,
            layerGroupSlug: layerGroup.slug,
            layerSlug: layer.slug
          });

          if (--count === 0) { deferred.resolve(true); }
        };
      };

      prom = wantedService.getData(
        layer,
        geom,
        start,
        end,
        getOptsForLayer(layer)
      );

      prom.then(
        buildSuccesCallback(layer),
        buildErrorCallback(layer)
      );

      return ++count;
    };

    // TODO: get this from the server
    var getOptsForLayer = function (layer) {

      // agg ::= 'none' | 'rrc' | 'sum' | 'counts'

      switch (layer.slug) {
      case 'radar/basic':
        return {
          agg: 'rrc'
        };
      case 'use/wss':
        return {
          agg: 'sum'
        };
      default:
        return {};
      }
    };

    /**
     * @function
     * @memberof app.MapService
     * @param {L.Class} Leaflet layer.
     * @description Adds layer to map
     */
    var addLayer = function (map, layer) { // Leaflet Layer
      map.addLayer(layer);
    };

    /**
     * @function
     * @memberof app.MapService
     * @param  {L.Class} Leaflet layer
     * @description Removes layer from map
     */
    var removeLayer = function (map, layer) { // Leaflet Layer
      map.removeLayer(layer);
    };

    var _initiateLayers = function (layers, temporal) {

      if (temporal) {
        //TODO: initialize imageoverlays
        return layers;
      }

      else {
        angular.forEach(layers, function (layer) {
          if (layer.type === 'Vector') {
            layer.leafletLayer = _initiateVectorLayer(layer);
          } else if (layer.type === 'TMS') {
            layer.leafletLayer = _initiateTMSLayer(layer);
          } else if (layer.type === 'UTFGrid') {
            layer.leafletLayer = _initiateGridLayer(layer);
          } else if (layer.type === 'WMS' && layer.tiled) {
            layer.leafletLayer = _initiateWMSLayer(layer);
          } else if (!layer.tiled) {
            // TODO: initialise imageoverlay
          } else if (layer.type !== 'Store') {
            // this ain't right
            throw new Error(layer.type + ' is not a supported layer type');
          }
        });
      }
      return layers;
    };


    var _initiateVectorLayer = function (nonLeafLayer) {

      var leafletLayer;

      if (nonLeafLayer._tiled) {

        // Initiate a tiled Vector layer

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        leafletLayer = new LeafletService.TileDataLayer(url, {

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

        //throw new Error('Initiate (non-tiled) Vector layer, for e.g. events');
        return leafletLayer;
      }
      return leafletLayer;
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
          slug: nonLeafLayer.slug,
          minZoom: nonLeafLayer.min_zoom || 0,
          maxZoom: 19,
          detectRetina: true,
          zIndex: nonLeafLayer.z_index,
          ext: 'png'
        });

      return layer;
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
        slug: nonLeafLayer.slug,
        format: 'image/png',
        version: '1.1.1',
        minZoom: nonLeafLayer.min_zoom || 0,
        maxZoom: 19,
        zIndex: nonLeafLayer.z_index
      };

      if (nonLeafLayer.slug === 'landuse') {
        _options.styles = 'landuse';
      } else if (nonLeafLayer.slug === 'elevation') {
        _options.styles = 'BrBG_r';
        _options.effects = 'shade:0:3';
      } else if (nonLeafLayer.slug === 'isahw:BOFEK2012') {
        _options.styles = ''; // Add no styling for soil layer
      } else { // Default, used by zettingsvloeiingsproef
        _options.styles = 'BrBG_r';
        _options.effects = 'shade:0:3';
      }

      return LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
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
        minZoom: nonLeafLayer.min_zoom_click || 0,
        maxZoom: 19,
        order: nonLeafLayer.z_index,
        zIndex: nonLeafLayer.z_index
      });
      return layer;
    };

    ///////////////////////////////////////////////////////////////////////////

    return LayerGroup;
  }
]);
