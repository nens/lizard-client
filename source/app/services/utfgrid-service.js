/**
 * Service to handle utf grid requests.
 */
app.service('UtfGridService', ['$q', '$rootScope', 'MapService',
  function ($q, $rootScope, MapService) {

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
    function getDataFromUTF(latlng) {
      var deferred = $q.defer();
      // Get waterchainLayer or false
      var waterchainLayer = MapService.getLayer('grid', 'waterchain');
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
          getDataFromUTFAsynchronous(e, deferred);
        } else {
          // Resolve with response and update pointObject
          deferred.resolve(response);
        }
      } else {
        getDataFromUTFAsynchronous(e, deferred);
      }
      return deferred.promise;
    }

    /**
     * Adds listener to the broadcast from map-directive messaging
     * that the utf grid has finished loading.
     * 
     * @param  {object} e containing e.latlng for the 
     *                                  location of the click
     */
    function getDataFromUTFAsynchronous(e, promise) {
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
        var waterchainLayer = MapService.getLayer('grid', 'waterchain');
        var response = waterchainLayer._objectForEvent(e);
        // since this part executes async in a future turn of the event loop,
        // we need to wrap it into an $apply call so that the model changes are
        // properly observed.
        $rootScope.$apply(function () {
          promise.resolve(response);
        });
      });
    }

    return { getDataFromUTF: getDataFromUTF };

  }
]);
