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

app.service('VectorService', ['Restangular', 'LeafletService',
  function (Restangular, LeafletService) {

    /**
     * @function
     * @memberOf app.VectorService
     * @description filters geojson array on spatial bounds.
     * @param  {L.LatLngBounds} spatial
     * @param  {featureArray}   sourceArray
     * @return {filteredSet}    filtered set of features.
     */
    var filterSpatial = function (sourceArray, spatial) {
      var filteredSet = [];
      sourceArray.forEach(function (feature) {
        var withinBounds = spatial.contains(new LeafletService.LatLng(feature.geometry.coordinates[0], feature.geometry.coordinates[1]));
        if (withinBounds) {
          filteredSet.push(feature);
        }
      });
      return filteredSet;
    };

    /**
     * @function
     * @memberOf app.VectorService
     * @description filters geojson array on temporal bounds.
     * @param  {object}         start end object
     * @param  {featureArray}   sourceArray
     * @return {filteredSet}    filtered set of features.
     */
    var filterTemporal = function (sourceArray, temporal) {
      var filteredSet = [];
      sourceArray.forEach(function (feature) {
        var afterStart = false;
        var beforeEnd = false;
        if (temporal.start) {
          afterStart = feature.properties.timestamp_start >= temporal.start;
        }
        if (temporal.end) {
          beforeEnd = feature.properties.timestamp_end <= temporal.end;
        }

        if ((afterStart || temporal.start === undefined) &&
            (beforeEnd || temporal.end === undefined)) {
          filteredSet.push(feature);
        }
      });
      return filteredSet;
    };

    /**
     * @description filters data on time and spatial extent
     * @param  {L.LatLngBounds} spatial  Leaflet Bounds object
     * @param  {object}         temporal object with start and end in epoch timestamp
     * @return {filteredSet}    Array with points within extent.
     */
    var filterSet = function (sourceArray, spatial, temporal) {
      if (!spatial && !temporal) { return sourceArray; }

      var filteredSet = [];
      if (spatial instanceof LeafletService.LatLngBounds) {
        filteredSet = filterSpatial(sourceArray, spatial);
      } else {
        filteredSet = sourceArray;
      }

      if (!temporal) { return filteredSet; }

      if (temporal.hasOwnProperty('start') || temporal.hasOwnProperty('end')) {
        filteredSet = filterTemporal(filteredSet, temporal);
      }

      return filteredSet;
    };

    var vectorLayers = {};

    /**
     * @memberof app.VectorService
     * @function
     * @description gets data from backend
     * @param  {string} layer slug of layer
     * @param  {object} geomortime  geometry or time that it needs to get (e.g. bboxs)
     * @param  {object} time  start, stop object
     * @return {promise}
     */
    var getData = function (layerSlug, geomortime, time) {
      // if only one extra argument it can be geom or time.
      if (!time && !(geomortime instanceof L.LatLngBounds)) {
        return filterSet(vectorLayers[layerSlug].data, undefined, geomortime);
      }
      return filterSet(vectorLayers[layerSlug].data, geomortime, time);
    };

    var replaceData = function (layerSlug, data, zoom) {
      vectorLayers[layerSlug] = {
          data: [],
          zoom: zoom
        };
      Array.prototype.push.apply(vectorLayers[layerSlug].data, data);
    };

    var setData = function (layerSlug, data, zoom) {
      if (vectorLayers.hasOwnProperty(layerSlug) &&
          vectorLayers[layerSlug].zoom === zoom) {
          Array.prototype.push.apply(vectorLayers[layerSlug].data, data);
      } else {
        replaceData.apply(this, arguments);
      }
    };

    return {
      getData: getData,
      setData: setData
    };
  }
]);