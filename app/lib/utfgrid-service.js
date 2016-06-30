/**
 * Service to handle utf grid requests.
 */
angular.module('lizard-nxt')
  .service('UtfGridService', ['$q', '$rootScope', 'UtilService',

  function ($q, $rootScope, UtilService) {

    var getData = function (leafLayer, options) {

      var deferred = $q.defer(),
          e = { latlng: options.geom };

      var response = leafLayer._objectForEvent(e);

      if (leafLayer.isLoading) {
        _getDataFromUTFAsynchronous(leafLayer, e, deferred, options);
      }

      else {
        deferred.resolve(response.data);
      }

      return deferred.promise;
    };

    var _getDataFromUTFAsynchronous = function (

      leafLayer,
      e,
      deferred,
      options

    ) {

      var response;

      leafLayer.on('load', function () {
        var response = leafLayer._objectForEvent(e);
        if ($rootScope.$$phase) {
          deferred.resolve(response.data);
        } else {
          $rootScope.$apply(function () {
            deferred.resolve(response.data);
          });
        }
      });
    };

    return { getData: getData };
  }
]);
