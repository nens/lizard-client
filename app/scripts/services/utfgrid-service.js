/**
 * Service to handle utf grid requests.
 */
angular.module('lizard-nxt')
  .service('UtfGridService', ['$q', '$rootScope',

  function ($q, $rootScope) {

    var getData = function (nonLeafLayer, options) {
      var leafLayer = nonLeafLayer && nonLeafLayer._leafletLayer,
        deferred = $q.defer(),
        e = {
          latlng: options.geom
        },
        response;

      if (options.geom === undefined || !(options.geom instanceof L.LatLng)) {
        // no geom is no data from utf
        deferred.reject();
        return deferred.promise;
      }

      if (leafLayer) {

        response = leafLayer._objectForEvent(e);

        if ((response.data === null && leafLayer.isLoading)
          || !leafLayer._map || !leafLayer._map.hasLayer(leafLayer)) {
          _getDataFromUTFAsynchronous(nonLeafLayer, e, deferred);

        } else {
          deferred.resolve(response.data);
        }

      } else {
        deferred.resolve(false);
      }

      return deferred.promise;
    };


    var _getDataFromUTFAsynchronous = function (nonLeafLayer, e, deferred) {
      var leafLayer, response;

      leafLayer = nonLeafLayer._leafletLayer;

      leafLayer.on('load', function () {
        response = leafLayer._objectForEvent(e);

        // since this part executes async in a future turn of the event loop,
        // we need to wrap it into an $apply call so that the model changes are
        // properly observed:
        $rootScope.$apply(function () {
          deferred.resolve(response.data);
        });
      });
    };

    return { getData: getData };
  }
]);
