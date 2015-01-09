'use strict';

/**
 * @ngdoc service
 * @class VectorService
 * @memberof app
 * @name VectorService
 * @summary Receives and returns vector data, as a service (or VDaaS).
 * @description VectorService is responsible for retreiving, storing
 * and exposing vector typed data.
 *
 */

angular.module('lizard-nxt')
  .service('VectorService', ['$q',
                             '$rootScope',
                             'LeafletService',
                             'UtilService',
                             'CabinetService',
  function ($q, $rootScope, LeafletService, UtilService, CabinetService) {

    /**
     * @function
     * @description filters geojson array on spatial bounds.
     * @param  {L.LatLngBounds} spatial
     * @param  {featureArray}   sourceArray
     * @return {filteredSet}    filtered set of features.
     */
    var filterSpatial = function (sourceArray, spatial) {
      var filteredSet = [];
      var query = spatial instanceof LeafletService.LatLngBounds ? 'contains' : 'equals';
      sourceArray.forEach(function (feature) {
        var withinBounds;
        // if (feature.geometry.type === "Polygon") {
        //   var maxLat = feature.geometry.coordinates[0][0][0],
        //       minLat = feature.geometry.coordinates[0][0][0],
        //       minLon = feature.geometry.coordinates[0][0][1],
        //       maxLon = feature.geometry.coordinates[0][0][1];
        //   window.feature = feature
        //   feature.geometry.coordinates[0].forEach(function (coordinates) {
        //     maxLon = Math.max(coordinates[1], maxLon);
        //     maxLat = Math.max(coordinates[0], maxLat);
        //     minLon = Math.min(coordinates[1], minLon);
        //     minLat = Math.min(coordinates[0], minLat);
        //   });
        //   // if as much as one point is visible in extent draw it.
        //   withinBounds = (
        //     spatial.contains(new LeafletService.LatLng(maxLat, maxLon)) ||
        //     spatial.contains(new LeafletService.LatLng(maxLat, minLon)) ||
        //     spatial.contains(new LeafletService.LatLng(minLat, maxLon)) ||
        //     spatial.contains(new LeafletService.LatLng(minLat, minLon))
        //     )
        // } else if (feature.geometry.type === "MultiPolygon") {
        //   // fuckall
        // } else
        if (feature.geometry.type === "Point") {
          var latLng = new LeafletService.LatLng(
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
            );
          withinBounds = spatial[query](latLng);
        }

        if (withinBounds) {
          filteredSet.push(feature);
        }
      });
      return filteredSet;
    };

    /**
     * @description - Checks whether a single feature must be drawn given
     *                a certain timeState.
     */
    var isInTempExtent = function (feature, temporal) {

      console.log("timestamp_start:", feature.properties.timestamp_start);
      console.log("temporal.start:", temporal.start);
      console.log("temporal.end:", temporal.end);
      console.log("---------------------");

      var eventStartBeforeTLStart = false,
          eventStartAfterTLStart = false,
          eventEndBeforeTLStart = false,
          eventEndAfterTLStart = false,
          eventEndBeforeTLEnd = false;

        if (temporal.start) {
          eventStartBeforeTLStart
            = feature.properties.timestamp_start < temporal.start;
          eventStartAfterTLStart
            = !eventStartBeforeTLStart;
          eventEndBeforeTLStart
            = feature.properties.timestamp_end < temporal.start;
          eventEndAfterTLStart
            = !eventEndBeforeTLStart;
        }

        if (temporal.end) {
          eventEndBeforeTLEnd
            = feature.properties.timestamp_end < temporal.end;
        }

        if (eventStartBeforeTLStart
            && eventEndAfterTLStart) { return true; }
        else if (
                  (temporal.start === undefined || eventStartAfterTLStart)
                  && (temporal.end === undefined || eventEndBeforeTLEnd)
                )
                { return true; }
        else {
          return false;
        }
    };

    /**
     * @function
     * @description filters geojson array on temporal bounds.
     * @param  {object}      start end object
     * @param  {feature[]}   sourceArray
     * @return {filteredSet} filtered set of features.
     */
    var filterTemporal = function (sourceArray, temporal) {
      var filteredSet = [];
      sourceArray.forEach(function (feature) {
        if (isInTempExtent(feature, temporal)) {
          filteredSet.push(feature);
        }
      });
      return filteredSet;
    };

    /**
     * @description filters data on time and spatial extent
     * @param  {L.LatLngBounds} spatial  Leaflet Bounds object
     * @param  {object}         temporal object with start and end in epoch
     *                          timestamp
     * @return {filteredSet}    Array with points within extent.
     */
    var filterSet = function (sourceArray, spatial, temporal) {
      if (!spatial && !temporal) { return sourceArray; }

      var filteredSet = [];

      // First filter spatially.
      if (spatial instanceof LeafletService.LatLngBounds
        || spatial instanceof LeafletService.LatLng) {
        filteredSet = filterSpatial(sourceArray, spatial);
      } else if (spatial === undefined) {
        filteredSet = sourceArray;
      } else if (spatial instanceof Array
        && spatial[0] instanceof LeafletService.LatLng) {
        // TODO: implement line intersect with vector data
        filteredSet = [];
      } else {
        throw new Error(
          spatial + "is an invalid geometry to query VectorService");
      }

      // Further refine spatially filtered by temporal filter.
      if (temporal.hasOwnProperty('start') || temporal.hasOwnProperty('end')) {
        filteredSet = filterTemporal(filteredSet, temporal);
      } else if (temporal === undefined) {
        return filteredSet;
      } else {
        throw new Error(temporal + "is an invalid time to query VectorService");
      }

      return filteredSet;
    };

    var vectorLayers = {};

    /**
     * @memberof app.VectorService
     * @function
     * @description gets data from backend
     * @param  {layer} layer as defined by layer-service
     * @param  {object} geomortime  geometry or time that it needs to get
     *                  (e.g. bboxs)
     * @param  {object} time  start, stop object
     * @return {promise}
     */
    var getData = function (nonLeafLayer, options) {
      var deferred = $q.defer(),
          layerSlug, layer;

      // leaflet knows nothing, so sends slug and leaflayer
      if (typeof nonLeafLayer === 'string') {
        layerSlug = nonLeafLayer;
      } else {
        layerSlug = nonLeafLayer.slug;
      }

      if (!vectorLayers[layerSlug] || vectorLayers[layerSlug].isLoading) {
        getDataAsync(layerSlug, layer, options, deferred);
      } else {
        var set = filterSet(vectorLayers[layerSlug].data,
        options.geom, {
          start: options.start,
          end: options.end
        });
        deferred.resolve(set);
      }

      return deferred.promise;
    };

    /**
     * @description Triggers resolve callback on loaded data.
     * @param {layer}
     * @param {options}
     * @param {promise}
     */
    var getDataAsync = function (layerSlug, layer, options, deferred) {
      if (!vectorLayers[layerSlug]) {

        vectorLayers[layerSlug] = {
          data: [],
          isLoading: true,
          promise: {}
        };

        vectorLayers[layerSlug].promise = CabinetService.tiles
        .one(layerSlug + '/0/0/0.geojson')
        .get().then(function (response) {
          vectorLayers[layerSlug].isLoading = false;
          setData(layerSlug, response.features, 1);
        });

      }

      vectorLayers[layerSlug].promise.then(function () {
        deferred.resolve(filterSet(vectorLayers[layerSlug].data,
          options.geom, {
            start: options.start,
            end: options.end
          }
        ));
      });

    };

    /**
     * @description redefines data if zoom level changed
     */
    var replaceData = function (layerSlug, data, zoom) {
      vectorLayers[layerSlug] = {
          data: [],
          zoom: zoom
        };
      vectorLayers[layerSlug].data = vectorLayers[layerSlug].data.concat(data);
    };

    /**
     * @description gets unique values and tosses duplicates
     * part of PostGis.js (ಠ_ಠ)
     */
    var getUnion = function (arr1, arr2) {
      return UtilService.union(arr1, arr2);
    };

    /**
     * @description appends data if zoom level hasn't changed
     *
     */
    var setData = function (layerSlug, data, zoom) {
      if (vectorLayers.hasOwnProperty(layerSlug)
        && vectorLayers[layerSlug].zoom === zoom) {
        vectorLayers[layerSlug].data = getUnion(
          vectorLayers[layerSlug].data, data);
      } else {
        replaceData.apply(this, arguments);
      }
    };

    return {
      getData: getData,
      setData: setData,
      isInTempExtent: isInTempExtent
    };
  }
]);
