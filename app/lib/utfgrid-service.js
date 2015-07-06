/**
 * Service to handle utf grid requests.
 */
angular.module('lizard-nxt')
  .service('UtfGridService', ['$q', '$rootScope', 'UtilService',

  function ($q, $rootScope, UtilService) {


    // UtfGridService has a local cache of the last query so the dataservice can
    // get an answer of the utfgrid even if there is no map.
    // NOTE: we use this as a 'poor man's state' of the 'last selected
    // object'. We might want to include the 'last selected object' in the
    // actual state so we can refer to it directly.
    var _cache = {};

    /**
     * @function buildCacheKey
     * @summary Calculate cache key for layer and options.
     *
     * @param {object} layer    nxt layer to use as key.
     * @param {object} options  options to use as key.
     * @returns {string} key
     */
    var buildCacheKey = function (layer, options) {

      var geomString;

      try {
        // bounds have a bbox string method
        geomString = options.geom.toBBoxString();
      }
      catch (e) {
        // latlngs have a tostring method
        geomString = options.geom.toString();
      }

      return  layer.slug + geomString;
    };

    /**
     * @function setToLocalCache
     * @summary Set data to local cache.
     *
     * @param {string} key  key to store data at.
     * @param {object} data data to cache.
     */
    var setToLocalCache = function (key, data) {
      _cache = {};  // reset cache because we only need to remember the last
                    // query.
      _cache[key] = data;
    };

    /**
     * @function getFromLocalCache
     * @summary Gets data for `key` from local cache. Returns undefined if `key`
     * doesn't exist.
     *
     * @return {object} Cached data or undefined if key doesn't exist.
     */
    var getFromLocalCache = function (key) {
      return _cache[key];
    };

    var getData = function (callee, nonLeafLayer, options) {

      var leafLayer = nonLeafLayer && nonLeafLayer._leafletLayer,
          geomType = UtilService.getGeomType(options.geom),
          deferred = $q.defer(),
          e = { latlng: options.geom },
          response,
          cacheKey = buildCacheKey(nonLeafLayer, options);

      if (
        options.geom === undefined
        || geomType === "LINE"
        || geomType === "REGION") {
        deferred.reject();
        return deferred.promise;
      }

      var cached = getFromLocalCache(cacheKey);
      if (cached) {
        response = cached;
        deferred.resolve(response.data);
      } else {
        response = _getResponseForGeomType(
          leafLayer, geomType, e, options.geom);

        if (!window.loaded
          || leafLayer.isLoading
          || !leafLayer._map
          || !leafLayer._map.hasLayer(leafLayer)
        ) {
          _getDataFromUTFAsynchronous(
            nonLeafLayer, e, deferred, geomType, options);
        } else {
          setToLocalCache(cacheKey, response);
          deferred.resolve(response.data);
        }
      }

      return deferred.promise;
    };

    var _getDataFromUTFAsynchronous = function (nonLeafLayer,
                                                e,
                                                deferred,
                                                geomType,
                                                options) {
      var response, leafLayer = nonLeafLayer._leafletLayer,
          cacheKey = buildCacheKey(nonLeafLayer, options);

      leafLayer.on('load', function () {
        response = _getResponseForGeomType(
          leafLayer, geomType, e, options.geom);
        if ($rootScope.$$phase) {
          setToLocalCache(cacheKey, response);
          deferred.resolve(response.data);
        } else {
          $rootScope.$apply(function () {
            setToLocalCache(cacheKey, response);
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
          "UtfGridService._getResponseForGeomType called with invalid " +
          " arg 'geomType', which happened to be:",
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

        // For now (15-01-2015), don't take into account structures with a geom
        // type other than POINT. Since this will probably be reverted some time
        // in the foreseeable future, we simply comment the relevant code and
        // return false.

        // var lineStart = L.latLng(
        //       structureGeom.coordinates[0][1],
        //       structureGeom.coordinates[0][0]
        //     ),
        //     lineEnd = L.latLng(
        //       structureGeom.coordinates[1][1],
        //       structureGeom.coordinates[1][0]
        //     );

        // TODO: Fix detection of lines that overlap the extent, but that do
        // not start nor end within the extent. It negligable for now.
        //return leafletBounds.contains(lineStart) || leafletBounds.contains(lineEnd);

        return false;

      default:
        throw new Error("Did not find valid geom type:", structureGeom.type);
      }
    };

    var _groupStructuresByEntityName = function (structures, geomOpts) {

      var uniqueId,
          currentEntityName,
          structure,
          structureGeom,
          leafletBounds = L.latLngBounds(
            geomOpts._southWest, geomOpts._northEast),
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
