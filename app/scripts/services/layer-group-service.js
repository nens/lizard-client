
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
 *
 *
 * TODO:
 *
 * - [ ] Move animation out of here. Layergroups adhere to time but should not have
 *       a notion of *animation* and should not *set* timeState to the out side
 *       world. Instead it should communicate with promises to the *animator* whether
 *       it is ready adhering to the timeState.
 *
 * - [ ] AnimState should not have to contain any state other than the time it is
 *       adhering and the leafletLayers (frames) it currently has.
 *
 * - [ ] Temporal layergroups should initiate when toggled to active for the first
 *       time. There should not be a _animState.initiated since the layergroup
 *       already has an initiated property.
 *
 */
angular.module('lizard-nxt')
  .factory('LayerGroup', [
  'Layer', 'UtilService', '$q',
  function (Layer, UtilService, $q) {

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
        value: [],
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

      // Instantiate a Layer for every servserside layer of
      // the layergroup. Talk to the _layers from here on.
      angular.forEach(layerGroup.layers, function (layer) {
        this._layers.push(new Layer(layer));
      });

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
          this._initializeLeafletLayers(this._layers, this.temporal);
          this._initiated = true;
        }

        this._active = !this._active;

        this.toggleLayers(this._layers, this._active);
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
            promises.push(layer.getData(options, deferred));
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
       * Make layerGroup adhere to current timestate
       */
      adhereToTime: function (mapState, timeState, oldTime) {
        if (oldTime === timeState.at) { return; }
        angular.forEach(this._layers, function (layer) {
          layer.adhereToTime(mapState, timeState, oldTime);
        });
      },

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {L.Class} Leaflet layer
       * @param temproal boolean describing whether the layer is temporal
       * @description delegates initialization of leaflet layers to other
       *              functions.
       */
      _initializeLayers: function () {
        angular.forEach(this._layers, function (layer) {
          layer.initializeLayer();
        });
      }

    };

    ///////////////////////////////////////////////////////////////////////////

    var toggleLayers = function (map, layers, active) {
      var method = active ? 'add' : 'remove';
      angular.forEach(layers, function (layer) {
        layer[method](map);
      });
    };

    ///////////////////////////////////////////////////////////////////////////

    return LayerGroup;
  }
]);
