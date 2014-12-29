
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
angular.module('data-menu')
  .factory('DataLayerGroup', [
  'NxtLayer', 'NxtDataLayer', 'UtilService', '$q', '$http',
  function (NxtLayer, NxtDataLayer, UtilService, $q, $http) {

    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and
     *              non-configurable properties
     * @param  {object} layergroup definition as coming from the server
     */
    function LayerGroup(layerGroup, callbackFns) {
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
      Object.defineProperty(this, '_dataLayers', {
        value: [],
        writable: true,
      });
      Object.defineProperty(this, 'mapLayers', {
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

      this.callbackFns = callbackFns;

      this.instantiateLayers(layerGroup.layers, layerGroup.temporal_resolution);

    }

    LayerGroup.prototype = {

      constructor: LayerGroup,

      instantiateLayers: function (layers, tempRes) {
        // Instantiate a Layer for every servserside layer of
        // the layergroup. There are layers that are drawn on the
        // map by the map-servie that go in mapLayers, layers that
        // are just used for data purposes are put in dataLayers
        // and layers that do both.
        angular.forEach(layers, function (layer) {
          if (layer.format === 'UTFGrid'
            || layer.format === 'Vector') {
            var nxtLayer = new NxtDataLayer(layer, tempRes);
            this._dataLayers.push(nxtLayer);
            this.mapLayers.push(nxtLayer);
          }
          else if (layer.format === 'Store') {
            this._dataLayers.push(new NxtDataLayer(layer, tempRes));
          }
          else if (layer.format === 'TMS'
            || layer.format === 'WMS') {
            this.mapLayers.push(new NxtLayer(layer, tempRes));
          }
        }, this);
      },

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description toggles a layergroup on the given map.
      * @param  {object} map Leaflet map to toggle this layer on
      */
      toggle: function (map) {
        this._active = !this._active;
        if (this.callbackFns && this.callbackFns.onToggleLayerGroup) {
          this.callbackFns.onToggleLayerGroup(this);
        }
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
          angular.forEach(this._dataLayers, function (layer) {
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
        this._opacity = newOpacity;
        if (this.callbackFns && this.callbackFns.onOpacityChange) {
          this.callbackFns.onOpacityChange(this);
        }
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
       * calls double click callback function when layergroup item in menu
       * is double clicked. Used by the map to rescale.
       */
      dblClick: function () {
        if (this.callbackFns && this.callbackFns.onDblClick) {
          this.callbackFns.onDblClick(this);
        }
      }

    };

    return LayerGroup;

  }
]);
