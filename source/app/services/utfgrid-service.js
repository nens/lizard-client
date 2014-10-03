/**
 * Service to handle utf grid requests.
 */
app.service('UtfGridService', ['$q', '$rootScope',

  function ($q, $rootScope) {

    var getData = function (nonLeafLayer, options) {
      if (options.geom === undefined) {
        throw new Error('Getting data for' + nonLeafLayer.slug + 'requires geom on options');
      }

      var leafLayer = nonLeafLayer && nonLeafLayer.leafletLayer,
        deferred = $q.defer(),
        e = {
          latlng: options.geom
        },
        response;

      if (leafLayer) {

        response = leafLayer._objectForEvent(e);

        if (response.data === null && leafLayer.isLoading) {
          _getDataFromUTFAsynchronous(nonLeafLayer, e, deferred);

        } else {
          deferred.resolve(response.data);
        }

      } else if ($rootScope.mapState.layerGroups.waterchain.active) {
        _getDataFromUTFAsynchronous(nonLeafLayer, e, deferred);

      } else {
        deferred.resolve(false);
      }

      return deferred.promise;
    };


    var _getDataFromUTFAsynchronous = function (nonLeafLayer, e, promise) {

      var leafLayer, response;

      leafLayer = nonLeafLayer && nonLeafLayer.leafletLayer;

      if (leafLayer) {

        leafLayer.on('load', function () {

          response = leafLayer._objectForEvent(e);

          // since this part executes async in a future turn of the event loop,
          // we need to wrap it into an $apply call so that the model changes are
          // properly observed:

          $rootScope.$apply(function () {
            promise.resolve(response.data);
          });
        });

      } else {

        $rootScope.$apply(function () {
          promise.resolve(false);
        });
      }
    };

    return { getData: getData };
  }
]);
