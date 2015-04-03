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
     * Returns true if feature has the type and id provided by the objectFilter.
     * @param  {object} objectFilter object with type and id
     * @param  {object} feature      feature to check for type and id of
     *                               properties.object.
     * @return {boolean}              [description]
     */
    var checkRelatedToObject = function (objectFilter, feature) {
      return feature.properties.object
        && feature.properties.object.type === objectFilter.type
        && feature.properties.object.id === objectFilter.id;
    };

    /**
     * @function
     * @description filters geojson array on spatial bounds.
     * @param  {L.LatLngBounds} spatial
     * @param  {featureArray}   sourceArray
     * @return {filteredSet}    filtered set of features.
     */
    var filterSpatial = function (sourceArray, spatial, objectFilter) {
      var filteredSet = [];
      var query = spatial instanceof LeafletService.LatLngBounds ? 'contains' : 'equals';
      sourceArray.forEach(function (feature) {
        var withinBounds,
            partOfObject;

        if (feature.geometry.type === "Point") {
          var latLng = new LeafletService.LatLng(
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
            );
          withinBounds = spatial[query](latLng);
        }

        if (objectFilter) {
          partOfObject = checkRelatedToObject(objectFilter, feature);
        }

        if (withinBounds || partOfObject) {
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
      var eventStartBeforeTLStart = false,
          eventStartAfterTLStart = false,
          eventEndBeforeTLStart = false,
          eventEndAfterTLStart = false,
          eventEndBeforeTLEnd = false;

      if (feature.properties) { feature = feature.properties; }

      if (temporal.start) {
        eventStartBeforeTLStart
          = feature.timestamp_start < temporal.start;
        eventStartAfterTLStart
          = !eventStartBeforeTLStart;
        eventEndBeforeTLStart
          = feature.timestamp_end < temporal.start;
        eventEndAfterTLStart
          = !eventEndBeforeTLStart;
      }

      if (temporal.end) {
        eventEndBeforeTLEnd
          = feature.timestamp_end < temporal.end;
      }

      var result;
      if (eventStartBeforeTLStart
          && eventEndAfterTLStart) { result = true; }
      else if (
                (temporal.start === undefined || eventStartAfterTLStart)
                && (temporal.end === undefined || eventEndBeforeTLEnd)
              )
              { result = true; }
      else {
        result = false;
      }

      return result;
    };

    /**
     * @function
     * @description filters geojson array on temporal bounds.
     * @param  {object}      start end object
     * @param  {feature[]}   sourceArray
     * @return {filteredSet} filtered set of features.
     */
    var filterTemporal = function (sourceArray, temporal) {
      return sourceArray.filter(function (feature) {
        return isInTempExtent(feature, temporal);
      });
    };

    /**
     * @description filters data on time, spatial extent and relation to object.
     * @param  {L.LatLngBounds} spatial  Leaflet Bounds object
     * @param  {object}         temporal object with start and end in epoch
     *                          timestamp
     * @param {object}          objectFilter object with type and id of object.
     * @return {filteredSet}    Array with points within extent.
     */
    var filterSet = function (filteredSet, spatial, objectFilter, temporal) {
      if (!spatial && !temporal && !objectFilter) { return filteredSet; }

      // First filter temporal.
      if (temporal.hasOwnProperty('start') || temporal.hasOwnProperty('end')) {
        filteredSet = filterTemporal(filteredSet, temporal);
      } else if (temporal) {
        throw new Error(temporal + "is an invalid time to query VectorService");
      }

      // Second filter spatially but leave features in the set when related to
      // object.
      if (spatial instanceof LeafletService.LatLngBounds
        || spatial instanceof LeafletService.LatLng) {
        filteredSet = filterSpatial(filteredSet, spatial, objectFilter);
      } else if (spatial instanceof Array
        && spatial[0] instanceof LeafletService.LatLng) {
        // TODO: implement line intersect with vector data
        filteredSet = [];
      } else if (spatial) {
        throw new Error(
          spatial + "is an invalid geometry to query VectorService");
      }

      return filteredSet;
    };

    var vectorLayers = {};

    /**
     * @memberof app.VectorService
     * @function
     * @description gets data from backend
     * @param  {string} callee string of the callee to keep requests
     *                         seperate NOTE: not implemented in this service.
     * @param  {layer} layer as defined by layer-service
     * @param  {object} geomortime  geometry or time that it needs to get
     *                  (e.g. bboxs)
     * @param  {object} time  start, stop object
     * @return {promise}
     */
    var getData = function (callee, nonLeafLayer, options) {
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
        options.geom, options.object, {
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

        vectorLayers[layerSlug].promise = CabinetService.events
        .get({'filter:event_series__layer__slug': layerSlug}).then(function (response) {
          vectorLayers[layerSlug].isLoading = false;
          setData(layerSlug, response.results, 1);
        });

      }

      vectorLayers[layerSlug].promise.then(function () {
        deferred.resolve(filterSet(vectorLayers[layerSlug].data,
          options.geom, options.objectFilter, {
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
