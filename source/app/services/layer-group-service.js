
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
app.factory('LayerGroup', ['VectorService', 'RasterService', 'LeafletService', '$q',
  function (VectorService, RasterService, LeafletService, $q) {

    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and non-configurable
     *              properties
     * @param  {object} layergroup definition
     */
    function LayerGroup(layerGroup) {

      angular.forEach(layerGroup, function (value, key) {
        Object.defineProperty(this, '_' + key, {
          value: value,
          write: key === 'active',
          configurable: true,
          enumerable: false
        });
      });
    }

    LayerGroup.prototype = {

      constructor: LayerGroup,

     /*
      * @function
      * @memberOf app.LayerGroup
      * @description Returns a promise that notifies with data for every layer of
      *              the layergroup. It resolves when all data is in.
      * @param  {object} geom latLng object with lat and lng properties or a list of
      *                       such objects.
      * @return  {promis} notifies with data per layer and resolves when all layers
      *                   returned data.
      */
      getData: function (geom) {

        var deferred = $q.defer();
        if (!this._active) { deferred.resolve(false); }
        var promise = deferred.promise;

        var succes = function (data) {
          var notification = {
            data: data,
            type: layer.type
          };
          deferred.notify(notification);
          promiseCount--;
          if (promiseCount === 0) { deferred.resolve(true); }
        }

        var error = function (msg) {
          var notification = {
            msg: msg,
            type: layer.type
          };
          deferred.notify(notification);
          promiseCount--;
          if (promiseCount === 0) { deferred.resolve(true); }
        }

        var promiseCount = 0;
        angular.forEach(this._layers, function (layer) {

          if (layer.type === 'Raster') {
            var rasterProm = RasterService.getData(geom, layer.slug);

            promiseCount++;

            rasterProm.then(succes.apply(layer), error);

          } else if (layer.type === 'Vector') {
            var vectorProm = VectorService.getData(geom, layer.slug);

            promiseCount++;

            vectorProm.then(succes);
          } else {
            deferred.resolve(true);
          }


        });

        return promise;
      },

      toggle: function (slug) {
        if (!this._initiated) {
          this._layers = initiateLayers(this._layers);
          this._initiated = true;
        }
        if (this.baselayer && slug === this.slug) {
          // on
        } else if (this.baselayer && slug !== this.slug) {
          // off
        } else if (slug === this.slug) {
          // _toggle
        }
      }

    };

    var initiateLayers = function (layers) {
      //initiate leaflet? layers
      angular.forEach(layers, function (layer) {
        if (layer.type === 'types') {
          // do it
        }
      });
    };

    return LayerGroup;

}]);
