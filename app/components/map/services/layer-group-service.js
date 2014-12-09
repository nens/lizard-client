
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
angular.module('lizard-nxt')
  .factory('LayerGroup', [
  'NxtTMSLayer', 'NxtWMSLayer', 'NxtNonTiledWMSLayer', 'NxtVectorLayer', 'NxtUTFLayer', 'StoreLayer', 'NxtLayer',
  'UtilService', '$q', '$http',
  function (NxtTMSLayer, NxtWMSLayer, NxtNonTiledWMSLayer, NxtVectorLayer, NxtUTFLayer, StoreLayer, NxtLayer, UtilService, $q, $http) {

    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and
     *              non-configurable properties
     * @param  {object} layergroup definition as coming from the server
     */
    function LayerGroup(layerGroup) {
      Object.defineProperty(this, 'temporal', {
        value: layerGroup.temporal,
        writable: false,
      });
      Object.defineProperty(this, 'temporalResolution', {
        value: layerGroup.temporal_resolution,
        writable: false,
      });
      Object.defineProperty(this, 'name', {
        value: layerGroup.name,
        writable: false,
      });
      Object.defineProperty(this, 'order', {
        value: layerGroup.order,
        writable: false,
      });
      Object.defineProperty(this, 'baselayer', {
        value: layerGroup.baselayer,
        writable: false,
      });
      Object.defineProperty(this, 'slug', {
        value: layerGroup.slug,
        writable: false,
      });
      Object.defineProperty(this, 'defaultActive', {
        value: layerGroup.active,
        writable: false,
      });
      Object.defineProperty(this, '_layers', {
        value: [],
        writable: true,
      });
      Object.defineProperty(this, '_opacity', {
        value: layerGroup.opacity,
        writable: true,
      });
      Object.defineProperty(this, '_active', {
        value: false,
        writable: true,
      });

      // Instantiate a Layer for every servserside layer of
      // the layergroup.
      var layers = this._layers;
      angular.forEach(layerGroup.layers, function (layer) {
        if (layer.format === 'TMS') {
          layers.push(new NxtTMSLayer(layer));
        }
        else if (layer.format === 'WMS' && layer.tiled) {
          layers.push(new NxtWMSLayer(layer));
        }
        else if (layer.format === 'WMS' && !layer.tiled) {
          layers.push(new NxtNonTiledWMSLayer(layer, layerGroup.temporal_resolution));
        }
        else if (layer.format === 'UTFGrid') {
          layers.push(new NxtUTFLayer(layer));
        }
        else if (layer.format === 'Vector') {
          layers.push(new NxtVectorLayer(layer));
        }
        else if (layer.format === 'Store') {
          layers.push(new StoreLayer(layer));
        }
        else {
          // this ain't right
          throw new Error(this.format + ' is not a supported layer format');
        }
      });

      // Sort them
      this._layers = sortLayers(layers);

    }

    LayerGroup.prototype = {

      constructor: LayerGroup,

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description toggles a layergroup on the given map.
      * @param  {object} map Leaflet map to toggle this layer on
      */
      toggle: function (map) {
        if (!this._initiated) {
          this._initializeLayers(this._layers);
          this._initiated = true;
        }

        this._active = !this._active;

        this._toggleLayers(map, this._layers, this._active);
      },

      /**
       * Returns true is the current layerGroup (i.e. "this") is active and false
       * otherwise.
       */
      isActive: function () {
        return this._active;
      },

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
            deferred = $q.defer(),
            promises = [];

        if (!this._active) {
          deferred.resolve({slug: this.slug, active: this._active});
          return deferred.promise;
        }
        else {
          angular.forEach(this._layers, function (layer) {
            promises.push(layer.getData(lgSlug, options, deferred));
          });
        }

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
       *
       * Will move to layer-service or become obslote.. here for now
       * @function
       * @memberof app.LayerGroup
       * @param {object} layer passed
       * @description determine if raster layer can be rescaled
       */
      rescaleContinuousData: function (bounds) {
        angular.forEach(this._layers, function (layer) {
          layer.rescale(bounds);
        });
      },

      /**
       * @function
       * @memberof app.LayerGroup
       * @param {float} new opacity value
       * @return {void}
       * @description Changes opacity in layers that have
       * an opacity to be set
       */
      setOpacity: function (newOpacity) {
        if (typeof newOpacity !== 'number' ||
            newOpacity < 0 && newOpacity > 1) {
          throw new Error(newOpacity + "is not a valid opacity value, it is"
            + "either of the wrong type or not between 0 and 1");
        }
        if (this._active) {
          angular.forEach(this._layers, function (layer) {
            layer.setOpacity(newOpacity);
          });
        }
        this._opacity = newOpacity;
      },

      /**
       * @function
       * @member app.LayerGroup
       * @return {float} opacity from 0 to 1.
       * @description retrieve opacity from layer
       */
      getOpacity: function () {
        return this._opacity;
      },

      /**
       * Make layerGroup adhere to current timestate
       */
      syncTime: function (timeState, map) {
        var defer = $q.defer();
        if (!this._active) {
          angular.forEach(this._layers, function (layer) {
            layer.timeState = timeState;
          });
          defer.resolve();
        }
        else {
          var promises = [];
          for (var i in this._layers) {
            var layer = this._layers[i];
            promises.push(layer.syncTime(timeState, map));
          }
          $q.all(promises).then(function () { defer.resolve(); });
        }
        return defer.promise;
      },

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {L.Class} Leaflet layer
       * @param temproal boolean describing whether the layer is temporal
       * @description delegates initialization of leaflet layers to other
       *              functions.
       */
      _initializeLayers: function (layers) {
        angular.forEach(layers, function (layer) {
          layer.initializeLayer();
        });
      },

      _toggleLayers: function (map, layers, active) {
        if (active && layers.length > 0) {
          addLayersRecursively(map, layers, 0);
        }
        else {
          angular.forEach(layers, function (layer) {
            if (layer._leafletLayer) {
              layer._leafletLayer.off('load');
              layer._leafletLayer.off('loading');
            }
            layer.remove(map);
          });
        }
        if (this._opacity) {
          this.setOpacity(this._opacity);
        }
      }
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {array} Array of nxt layers
     * @return {array} Array of object sorted by property loadOrder in
     *                 descending order.
     * @description Sorts layers by descending loadOrder
     */
    var sortLayers = function (layers) {
      layers.sort(function (a, b) {
        if (a.loadOrder > b.loadOrder) {
          return -1;
        }
        if (a.loadOrder < b.loadOrder
          || a.loadOrder === null) {
          return 1;
        }
        // a must be equal to b
        return 0;
      });
      return layers;
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {object} map Leaflet map to add layers to
     * @param  {array} Array of nxt layers
     * @param  {int} i index to start from
     * @description Adds the layers with the loadorder of layers[i]. Catches
     *              the returned promises and calls itself with the nxt index.
     *              When all layers are loaded it adds a listener to the last
     *              layer with the highest loadOrder.
     */
    var addLayersRecursively = function (map, layers, i) {
      var currentLoadOrder = layers[i].loadOrder;
      // Wrap contains the promises and the nxt index.
      var wrap = loadLayersByLoadOrder(map, layers, i, currentLoadOrder);
      // If there is more, wait for these layers to resolve
      // and start over with the remaining layers.
      if (wrap.i < layers.length) {
        startOverWhenDone(wrap.promises, map, layers, wrap.i);
      }
      // When done, add listener to the last layer with the max loadOrder
      // that is drawn on the map.
      else if (layers.length > 1) {
        var index = getIndexOfLeadingLayer(layers);
        if (typeof(index) === 'number') {
          addLoadListenersToLayer(map, layers, index);
        }
      }
    };


    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @param  {inte} loadOrder Current load order to add layers.
     * @return {object} next index and list of promises that resolve when layer
     *                       is fully loaded.
     * @description Adds the layers from index i with the given loadorder to the
     *              map. Returns the current index and a list of promises for
     *              all the added layers when a layer with a lower loadorder is
     *              found.
     */
    var loadLayersByLoadOrder = function (map, layers, i, loadOrder) {
      // Add all layers with the current load order
      var promises = [];
      while (i < layers.length
        && layers[i].loadOrder === loadOrder) {
        promises.push(layers[i].add(map));
        i++;
      }
      return {
        i: i,
        promises: promises
      };
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {array} layers Array of nxt layers.
     * @return {int} Index of the last layer with the highest loadOrder.
     * @description Loops through the sorted layers and returns the index of the
     *              last layer in the array with the highest loadOrder.
     */
    var getIndexOfLeadingLayer = function (layers) {
      var index;
      var highestLoadingOrder = 0;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].tiled
          && (layers[i].loadOrder > highestLoadingOrder
          || layers[i].loadOrder === highestLoadingOrder)) {
          index = i;
          highestLoadingOrder = index;
        }
      }
      return index;
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {array} Array of promises.
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Takes a list of promises and calls addLayersRecursively when
     *              all promises have resolved.
     */
    var startOverWhenDone = function (promises, map, layers, i) {
      $q.all(promises).then(function () {
        addLayersRecursively(map, layers, i);
      });
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Adds listeners that call when load starts and finished to
     *              the layer at index i of layers. Callbacks remove layers of
     *              the map after index i when load starts and adds layers after
     *              index i recursively when load finishes.
     */
    var addLoadListenersToLayer = function (map, layers, i) {
      var layer = layers[i];
      var j = i + 1;

      var removeAllAfterI = function () {
        for (j; j < layers.length; j++) {
          layers[j].remove(map);
        }
      };

      var reAdd = function () {
        addLayersRecursively(map, layers, i + 1);
      };

      layer._leafletLayer.off('load');
      layer._leafletLayer.off('loading');
      layer._leafletLayer.on('loading', removeAllAfterI);
      layer._leafletLayer.on('load', reAdd);
    };

    return LayerGroup;
  }
]);
