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
        response = _getResponseForGeomType(leafLayer, geomType, e, options.geom);
        if (!window.loaded
          || leafLayer.isLoading
          || !leafLayer._map
          || !leafLayer._map.hasLayer(leafLayer)
        ){
          _getDataFromUTFAsynchronous(nonLeafLayer, e, deferred, geomType, options.geom);
        } else {
          deferred.resolve(response.data);
        }
      } else {
        deferred.resolve(false);
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

    var _lineIntersect = function (line1, line2) {

      var x1 = line1[0][0],
          y1 = line1[0][1],
          x2 = line1[1][0],
          y2 = line1[1][1],

          x3 = line2[0][0],
          y3 = line2[0][1],
          x4 = line2[1][0],
          y4 = line2[1][1],

          x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4)),
          y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

      if (isNaN(x)||isNaN(y)) {
        return false;

      } else {

        if (x1>=x2) {
          if (!(x2<=x&&x<=x1)) { return false; }
        } else {
          if (!(x1<=x&&x<=x2)) { return false; }
        }
        if (y1>=y2) {
          if (!(y2<=y&&y<=y1)) { return false; }
        } else {
          if (!(y1<=y&&y<=y2)) { return false; }
        }
        if (x3>=x4) {
          if (!(x4<=x&&x<=x3)) { return false; }
        } else {
          if (!(x3<=x&&x<=x4)) { return false; }
        }
        if (y3>=y4) {
          if (!(y4<=y&&y<=y3)) { return false; }
        } else {
          if (!(y3<=y&&y<=y4)) { return false; }
        }
      }

      return true;
    };

    var _isWithinExtent = function (structureGeom, leafletBounds) {

      switch (structureGeom.type) {
        case "Point":
          return leafletBounds.contains(L.latLng(
            structureGeom.coordinates[1],
            structureGeom.coordinates[0]
          ));

        case "LineString":
          console.log("--> linestring; we need some.. MAGIC!");

          var lineStart = L.latLng(
                structureGeom.coordinates[0][1],
                structureGeom.coordinates[0][0]
              ),

              lineEnd = L.latLng(
                structureGeom.coordinates[1][1],
                structureGeom.coordinates[1][0]
              ),

              northLongitude = leafletBounds._northEast.lng,
              southLongitude = leafletBounds._southWest.lng,
              westLatitude = leafletBounds._southWest.lat,
              eastLatitude = leafletBounds._northEast.lat,

              borderNorth = [
                [northLongitude, westLatitude],
                [northLongitude, eastLatitude]
              ],
              borderSouth = [
                [southLongitude, westLatitude],
                [southLongitude, eastLatitude]
              ],
              borderWest = [
                [northLongitude, westLatitude],
                [southLongitude, westLatitude]
              ],
              borderEast = [
                [northLongitude, eastLatitude],
                [southLongitude, eastLatitude]
              ];

          /*
          Conditions for checking whether the line is (at least) partially within
          a boundingbox (only one needs to be true):

          - line starts in box
          - line ends in box
          - line intersects N border
          - line intersects E border
          - line intersects S border
          - line intersects W border
          */

          if (leafletBounds.contains(lineStart) || leafletBounds.contains(lineEnd)) {
            // line starts or ends in box;
            console.log("line starts/ends in extent");
            return true;
          } else if (_lineIntersect(structureGeom.coordinates, borderNorth)) {
            console.log("line intersects N");
            return true;
          } else if (_lineIntersect(structureGeom.coordinates, borderSouth)) {
            console.log("line intersects S");
            return true;
          } else if (_lineIntersect(structureGeom.coordinates, borderWest)) {
            console.log("line intersects W");
            return true;
          } else if (_lineIntersect(structureGeom.coordinates, borderEast)) {
            console.log("line intersects E");
            return true;
          } else {
            console.log("line is NOT in extent");
            return false;
          }

          break;
        default:
          throw new Error("[E] Did not found valid geom type:", structureGeom.type);
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
        groupedStructures.data[currentEntityName] = groupedStructures.data[currentEntityName] || {};
        groupedStructures.data[currentEntityName][uniqueId] = structure;
      }
      return groupedStructures;
    };

    return { getData: getData };
  }
]);
