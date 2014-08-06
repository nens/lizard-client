/**
 * Service to handle utf grid requests.
 */
app.service("UtfGridService", ["$q", "$rootScope",
  function ($q, $rootScope) {

    var on;

    /**
     * Gets data from utf grid.
     *  
     * @param  {object} latlng leaflet object specifying the location
     *                         of a click
     * @return {promise} $rootScope.defferred.promise Containing a thennable 
     *                         promise of an utf data object which is either
     *                         immediately resolved or resolved when the 
     *                         the grid layer has finished loading
     */
    function getDataFromUTF(map, latlng) {
      var deferred = $q.defer();
      // Get waterchainLayer or false
      var waterchainLayer = getLayer(map, 'grid', 'waterchain');
      // event object for utfgrid plugin
      var e = {
        latlng: latlng
      };
      if (waterchainLayer) {
        // Make call to private function from utfgrid plugin
        var response = waterchainLayer._objectForEvent(e);
        // If empty and still loading it might be empty because
        // the grid was there but did not contain the tile containing
        // this the latlng. 
        if (response.data === null && waterchainLayer.isLoading) {
          getDataFromUTFAsynchronous(e, deferred, map);
        } else {
          // Resolve with response and update pointObject
          deferred.resolve(response);
        }
      } else {
        getDataFromUTFAsynchronous(e, deferred, map);
      }
      return deferred.promise;
    }

    /**
     * Adds listener to the broadcast from map-directive messaging
     * that the utf grid has finished loading.
     * 
     * @param  {leaflet event object} e containing e.latlng for the 
     *                                  location of the click
     */
    function getDataFromUTFAsynchronous(e, promise, map) {
      // If there is no grid layer it is probably still being
      // loaded by the map-directive which will broadcast a 
      // message when its loaded. 
      if (on) {
        // cancel it
        on();
      }
      on = $rootScope.$on('waterchainGridLoaded', function () {

        // TODO: Must be implemented via ng watch, e.g.
        // $$rootScope.mapState.gridLoaded. Also, refactor map directive.

        on();
        var waterchainLayer = getLayer(map, 'grid', 'waterchain');
        var response = waterchainLayer._objectForEvent(e);
        // since this part executes async in a future turn of the event loop, we need to wrap
        // it into an $apply call so that the model changes are properly observed.
        $rootScope.$apply(function () {
          promise.resolve(response);
        });
      });
    }

    /**
     * Get layer from leaflet map object.
     *
     * Because leaflet doesn't supply a map method to get a layer by name or
     * id, we need this crufty function to get a layer.
     *
     * NOTE: candidate for (leaflet) util module
     *
     * @layerType: layerType, type of layer to look for either `grid`, `png`
     * or `geojson`
     * @param: entityName, name of ento
     * @returns: leaflet layer object or false if layer not found
     */
    var getLayer = function (map, layerType, entityName) {
      var layer = false,
          tmpLayer = {};
      for (var i in map._layers) {
        tmpLayer = map._layers[i];
        if (tmpLayer.options.name === entityName &&
            tmpLayer.options.ext === layerType) {
          layer = tmpLayer;
          break;
        }
      }
      return layer;
    };

    return { getDataFromUTF: getDataFromUTF };

  }
]);
