/**
 * Service to handle utf grid requests.
 */
angular.module('lizard-nxt')
  .service('UtfGridService', ['$q', '$rootScope', 'UtilService',

  function ($q, $rootScope, UtilService) {

    var getData = function (nonLeafLayer, options) {

      var leafLayer = nonLeafLayer && nonLeafLayer._leafletLayer,
          geomType = UtilService.getGeomType(options.geom),
          deferred = $q.defer(),
          e = { latlng: options.geom },
          response;

      if (options.geom === undefined || geomType === "LINE") {
        deferred.reject();
        return deferred.promise;
      }

      if (leafLayer) {

        response = _getResponseForGeomType(leafLayer, geomType, e);
        if (!window.loaded
          || leafLayer.isLoading
          || !leafLayer._map
          || !leafLayer._map.hasLayer(leafLayer)
        ){
          _getDataFromUTFAsynchronous(nonLeafLayer, e, deferred, geomType);
        }
        else {
          console.log("received response (in-sync/geom '" + geomType + "'):", response);
          deferred.resolve(response.data);
        }
      }
      else {
        deferred.resolve(false);
      }

      return deferred.promise;
    };

    var _getDataFromUTFAsynchronous = function (nonLeafLayer, e, deferred, geomType) {
      var response, leafLayer = nonLeafLayer._leafletLayer;
      leafLayer.on('load', function () {
        response = _getResponseForGeomType(leafLayer, geomType, e);
        console.log("received response (async/geom '" + geomType + "'):", response);
        if ($rootScope.$$phase) {
          deferred.resolve(response.data);
        } else {
          $rootScope.$apply(function () {
            deferred.resolve(response.data);
          });
        }
      });
    };

    var _getResponseForGeomType = function (leafLayer, geomType, e) {
      switch (geomType) {
      case 'POINT':
        return leafLayer._objectForEvent(e);
      case "LINE":
        return undefined;
      case "AREA":
        return _groupStructuresByEntityName(
          leafLayer.getUniqueStructuresForExtent()
        );
      default:
        throw new Error(
          "UtfGridService._getResponseForGeomType called with invalid arg 'geomType', which happened to be:",
          geomType
        );
      }
    };

    var _groupStructuresByEntityName = function (structures) {

      var uniqueId,
          currentEntityName,
          groupedStructures = { data: {} };

      for (uniqueId in structures.data) {
        currentEntityName = structures.data[uniqueId].entity_name;
        groupedStructures.data[currentEntityName]
          = groupedStructures.data[currentEntityName] || {};
        groupedStructures.data[currentEntityName][uniqueId]
          = structures.data[uniqueId];
      }
      return groupedStructures;
    };

    return { getData: getData };
  }
]);
