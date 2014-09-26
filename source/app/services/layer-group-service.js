
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

        var deferred = $q.defer();

        if (!this._active) { deferred.resolve(false); }

        var promise = deferred.promise;
        var promiseCount = 0;

        var buildSuccesCallback = function (layer) {

          return function (data) {
            deferred.notify({data: data, type: layer.type});
            promiseCount--;
            if (promiseCount === 0) { deferred.resolve(true); }
          };
        };

        var buildErrorCallback = function (layer) {

          return function (msg) {
            deferred.notify({msg: msg, type: layer.type});
            promiseCount--;
            if (promiseCount === 0) { deferred.resolve(true); }
          };
        };

        var buildPromise = function (layer) {

          var wantedService = layer.type === 'Vector'
            ? VectorService
            : RasterService;

          var prom = wantedService.getData(geom, layer.slug);
          promiseCount++;
          prom.then(
            buildSuccesCallback(layer),
            buildErrorCallback(layer)
          );

          return prom;
        };

        angular.forEach(this._layers, function (layer) {

          if (layer.type === 'Raster') {
            var rasterProm = buildPromise(layer);

          } else if (layer.type === 'Vector') {
            var vectorProm =  buildPromise(layer);

          } else {
            deferred.resolve(true);
          }
        });

        return promise;
      },

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description
      *
      */
      toggle: function (slug) {

        if (!this._initiated) {
          this._layers = _initiateLayers(this._layers);
          this._initiated = true;
        }

        if (this._baselayer) {
          this._active = slug === this._slug;

        } else if (slug === this._slug) {
          this._active = !this._active;
        }
      }
    };

    ///////////////////////////////////////////////////////////////////////////

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
            console.log('[E] This should never happen/print...');
            break;
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

        // Initiate Vector layer for events

        hier waren wij

      }
    };


    var _initiateTMSLayer = function (nonLeafLayer) {
      // this shall soon be implemented
    };


    var _initiateWMSLayer = function (nonLeafLayer) {
      // this shall soon be implemented
    };


    var _initiateGridLayer = function (nonLeafLayer) {
      // this shall soon be implemented
    };

    ///////////////////////////////////////////////////////////////////////////

    return LayerGroup;
}]);
