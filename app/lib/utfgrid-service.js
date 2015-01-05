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

      response = _getResponseForGeomType(leafLayer, geomType, e, options.geom);
      if (!window.loaded
        || leafLayer.isLoading
        || !leafLayer._map
        || !leafLayer._map.hasLayer(leafLayer)
      ) {
        _getDataFromUTFAsynchronous(nonLeafLayer, e, deferred, geomType, options.geom);
      } else {
        deferred.resolve(response.data);
      }

      return deferred.promise;
    };

    var _getDataFromUTFAsynchronous = function (nonLeafLayer, e, deferred, geomType, geomOpts) {
      var response, leafLayer = nonLeafLayer._leafletLayer;
      leafLayer.on('load', function () {
        response = _getResponseForGeomType(leafLayer, geomType, e, geomOpts);
        if ($rootScope.$$phase) {
          deferred.resolve(response.data);
        } else {
          $rootScope.$apply(function () {
            deferred.resolve(response.data);
          });
        }
      });
    };

    var _getResponseForGeomType = function (leafLayer, geomType, e, geomOpts) {
      switch (geomType) {
      case 'POINT':
        return leafLayer._objectForEvent(e);
      case "LINE":
        return undefined;
      case "AREA":
        return _groupStructuresByEntityName(
          leafLayer.getUniqueStructuresForExtent(),
          geomOpts
        );
      default:
        throw new Error(
          "UtfGridService._getResponseForGeomType called with invalid arg 'geomType', which happened to be:",
          geomType
        );
      }
    };

    var _isWithinExtent = function (structureGeom, leafletBounds) {

      switch (structureGeom.type) {
        case "Point":
          return leafletBounds.contains(L.latLng(
            structureGeom.coordinates[1],
            structureGeom.coordinates[0]
          ));

        case "LineString":
          var lineStart = L.latLng(
                structureGeom.coordinates[0][1],
                structureGeom.coordinates[0][0]
              ),
              lineEnd = L.latLng(
                structureGeom.coordinates[1][1],
                structureGeom.coordinates[1][0]
              );

          // TODO: Fix detection of lines that overlap the extent, but that do
          // not start nor end within the extent. It negligable for now.
          return leafletBounds.contains(lineStart) || leafletBounds.contains(lineEnd);

        default:
          throw new Error("Did not find valid geom type:", structureGeom.type);
      }
    };

    var _groupStructuresByEntityName = function (structures, geomOpts) {

      var uniqueId,
          currentEntityName,
          structure,
          structureGeom,
          leafletBounds = L.latLngBounds(geomOpts._southWest, geomOpts._northEast),
          groupedStructures = { data: {} };

      for (uniqueId in structures.data) {

        structure = structures.data[uniqueId];
        structureGeom = JSON.parse(structure.geom);

        if (!_isWithinExtent(structureGeom, leafletBounds)) {
          continue;
        }

        currentEntityName = structure.entity_name;
        groupedStructures.data[currentEntityName]
          = groupedStructures.data[currentEntityName] || {};
        groupedStructures.data[currentEntityName][uniqueId] = structure;
      }
      return groupedStructures;
    };

    return { getData: getData };
  }
]);
