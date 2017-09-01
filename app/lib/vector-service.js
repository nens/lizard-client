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
 * NOTE: contrary to its name, this service raison d'etre is caching events.
 * Lizard can only serve all events of an eventseries. As a result adding events
 * takes a while but are then cached here.
 */

angular.module('lizard-nxt')
  .service('VectorService', ['$q',
                             '$rootScope',
                             'LeafletService',
                             'UtilService',
                             '$http',
  function ($q, $rootScope, LeafletService, UtilService, $http) {


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
          if (spatial instanceof LeafletService.LatLngBounds) {
            withinBounds = spatial.contains(latLng);
          } else {
            console.log("Comparing ", spatial, " and ", latLng);
            withinBounds = spatial.equals(latLng);
          }
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
      else if (feature.hasOwnProperty("timestamp")) {
        result = feature.timestamp >= temporal.start
                 && feature.timestamp <= temporal.end;
      }
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

      console.log("FILTERING SET!", filteredSet, "on:", spatial, objectFilter, temporal);

      // First filter temporal.
      if (temporal.hasOwnProperty('start') || temporal.hasOwnProperty('end')) {
        filteredSet = filterTemporal(filteredSet, temporal);
        console.log("After temporal, there are", filteredSet.length, "left");
      } else if (temporal) {
        throw new Error(temporal + "is an invalid time to query VectorService");
      }

      // Second filter spatially but leave features in the set when related to
      // object.

      var geom;
      if (spatial && spatial.type === 'Point') {
        geom = L.latLng(spatial.coordinates[1], spatial.coordinates[0]);
        filteredSet = filterSpatial(filteredSet, geom, objectFilter);
        console.log("After spatial point, there are", filteredSet.length, "left.");
      }
      else if (spatial && spatial.type === 'Polygon') {
        geom = L.geoJson(spatial).getBounds();
        filteredSet = filterSpatial(filteredSet, geom, objectFilter);
      }
      else if (spatial) {
        filteredSet = [];
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
     * @return {object}
     */
    var getData = function (options) {
      // Options is an object with parameters:
      // uuid: Django pk for event series
      // url: where to get the events
      // geom: optional, L.LatLngBound or L.LatLng to filter them with
      // objectFilter: optional {type: ..., id: ...} object to filter them with
      // start, end: optional timestamps to filter them with
      var deferred = $q.defer(),
          layerSlug;
      layerSlug = options.uuid;

      if (!vectorLayers[layerSlug] || vectorLayers[layerSlug].isLoading) {
        getDataAsync(options, deferred);
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

    var invalidateData = function (nonLeafLayer) {
      vectorLayers[nonLeafLayer.uuid] = null;
    };

    /**
     * @description Triggers resolve callback on loaded data.
     * @param {layer}
     * @param {options}
     * @param {object}
     */
    var getDataAsync = function (options, deferred) {
      if (!vectorLayers[options.uuid]) {

        vectorLayers[options.uuid] = {
          data: [],
          isLoading: true,
          promise: {}
        };

        vectorLayers[options.uuid].promise = $http({
          url: options.url,
          method: 'GET',
          params: { page_size: 5000 }
        })
        .then(function (response) {
          vectorLayers[options.uuid].isLoading = false;
          var data = response.data.results;
          var geoData = data.filter(
            function (item) { return item.geometry !== null; }
          );
          setData(options.uuid, geoData, 1);
        });

      }

      vectorLayers[options.uuid].promise.then(function () {
        deferred.resolve(filterSet(vectorLayers[options.uuid].data,
          options.geom, options.objectFilter, {
            start: options.start,
            end: options.end
          }
        ));
      });

    };

    /**
     * @description sets data.
     *
     */
    var setData = function (uuid, data, zoom) {
      vectorLayers[uuid] = {
        data: data,
      };
    };

    return {
      getData: getData,
      setData: setData,
      isInTempExtent: isInTempExtent,
      invalidateData: invalidateData
    };
  }
]);
