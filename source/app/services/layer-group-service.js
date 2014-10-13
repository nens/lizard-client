
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
     * @param  {object} layergroup definition as coming from the server
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
      * @description Returns a promise that notifies with data for every layer
      *              of the layergroup that is appplicable (i.e: rain and several
      *              vector layers). It resolves when all data is in.
      * @param  {object} geom latLng object with lat and lng properties or a list of
      *                       such objects.
      * @return  {promise} notifies with data per layer and resolves with value true
      *                    when layergroup was active, or false when layergroup was
      *                    inactive.
      */
      getData: function (options) {

        var lgSlug = this.slug,
            lgActive = this._active,
            deferred = $q.defer();

        if (!this._active) {
          deferred.resolve({slug: this.slug, active: this._active});
          return deferred.promise;
        }

        var promises = [];

        angular.forEach(this._layers, function (layer) {

          var wantedService;

          if (layer.type === 'Store') {
            wantedService = RasterService;
          }
          else if (layer.type === 'UTFGrid') {
            wantedService = UtfGridService;
          }
          else if (layer.type === 'Vector') {
            wantedService = VectorService;
          }
          else {
            // console.log('[E] someService.getData() was called w/o finding \'wantedService\' where wantedService =', wantedService);
          }

          if (wantedService) {

            promises.push(buildPromise(
              lgSlug,
              layer,
              options,
              deferred,
              wantedService
            ));
          }
        });

        // Bear with me: the promises from the individual getData's(),
        // notify() the defer from LayerGroup.getData() on resolve.
        // When all the individual promises have resolved, this defer
        // should be resolved. It resolves with 'true' to indicate activity
        // of layer. No need to keep a counter of the individual promises.
        $q.all(promises).then(function () {
          deferred.resolve({
            slug: lgSlug,
            active: lgActive
          });
        });

        return deferred.promise;
      },


     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description toggles a layergroup on the given map.
      * @param  {object} map Leaflet map to toggle this layer on
      */
      toggle: function (map) {

        if (!this._initiated) {
          this._layers = _initializeLeafletLayers(this._layers, this.temporal);
          this._initiated = true;
        }

        this._active = !this._active;

        // wtf is this.
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

   /**
    * @function
    * @memberOf app.LayerGroup
    * @description creates a promise for the given layer and the provided
    *              service. The service should have a getData function that
    *              returns a promise that is resolved when data is recieved.
    * @param lgSlug layerGroup slug to include in the response.
    * @param layer  nxtLayer definition.
    * @param options options containing geometry or time.
    * @param deffered deffered to notify when service.getData resolves.
    * @param wantedService Service to getData from.
    */
    var buildPromise = function (
      lgSlug,
      layer,
      options,
      deferred,
      wantedService) {

      var buildSuccesCallback = function (data) {
        deferred.notify({
          data: data,
          type: layer.type,
          layerGroupSlug: lgSlug,
          layerSlug: layer.slug,
          aggType: layer.aggregation_type
        });
      };

      var buildErrorCallback = function (msg) {
        deferred.notify({
          data:  null,
          type: layer.type,
          layerGroupSlug: lgSlug,
          layerSlug: layer.slug
        });
      };

      if (!options) { options = {}; }
      options.agg = layer.aggregation_type;

      return wantedService.getData(layer, options)
        .then(buildSuccesCallback, buildErrorCallback);
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param {L.Class} Leaflet layer.
     * @description Adds layer to map
     */
    var addLayer = function (map, layer) { // Leaflet Layer
      if (map.hasLayer(layer)) {
        throw new Error('Attempted to add layer' + layer._id + 'while it was already part of the map');
      } else { map.addLayer(layer); }
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {L.Class} Leaflet map
     * @param  {L.Class} Leaflet layer
     * @description Removes layer from map
     */
    var removeLayer = function (map, layer) { // Leaflet Layer
      if (map.hasLayer(layer)) { map.removeLayer(layer); }
      else {
        throw new Error('Attempted to remove layer' + layer._id + 'while it was not part of provided the map');
      }
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {L.Class} Leaflet layer
     * @param temproal boolean describing whether the layer is temporal
     * @description delegates initialization of leaflet layers to other
     *              functions.
     */
    var _initializeLeafletLayers = function (layers, temporal) {
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

      if (nonLeafLayer.tiled) {
        // Initiate a tiled Vector layer
        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        leafletLayer = new LeafletService.TileDataLayer(url, {
          minZoom: nonLeafLayer.min_zoom,
          maxZoom: nonLeafLayer.max_zoom,
          color: '#333',
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
        // throw new Error('Initiate (non-tiled) Vector layer, for e.g. events');
        return leafletLayer;
      }
      return leafletLayer;
    };


    /**
     * @function
     * @memberof app.LayerGroup
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
     * @memberof app.LayerGroup
     * @param  {object} nonLeafLayer as served from backend
     * @return {L.TileLayer.WMS}              [description]
     * @description Initiates a Leaflet WMS layer
     */
    var _initiateWMSLayer = function (nonLeafLayer) {
      var _options = {
        layers: nonLeafLayer.slug,
        format: 'image/png',
        version: '1.1.1',
        minZoom: nonLeafLayer.min_zoom || 0,
        maxZoom: 19,
        zIndex: nonLeafLayer.z_index
      };
      _options = angular.extend(_options, nonLeafLayer.options);

      return LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
    };

    /**
     * @function
     * @memberof app.LayerGroup
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
