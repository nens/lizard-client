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

app.service('VectorService', ['$q', '$rootScope', 'Restangular',
  'UtilService', 'LeafletService',
  function ($q, $rootScope, Restangular, UtilService, LeafletService) {

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
      var query = spatial instanceof LeafletService.LatLngBounds ? 'contains' : 'equals';
      sourceArray.forEach(function (feature) {
        var withinBounds;
        // if (feature.geometry.type === "Polygon") {
        //   var maxLat = feature.geometry.coordinates[0][0][0],
        //       minLat = feature.geometry.coordinates[0][0][0],
        //       minLon = feature.geometry.coordinates[0][0][1],
        //       maxLon = feature.geometry.coordinates[0][0][1];
        //   console.log(feature.geometry.coordinates)
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

      // First filter spatially.
      if (spatial instanceof LeafletService.LatLngBounds
        || spatial instanceof LeafletService.LatLng) {
        filteredSet = filterSpatial(sourceArray, spatial);
      } else if (spatial === undefined) {
        filteredSet = sourceArray;
      } else {
        throw new Error(spatial + "is an invalid geometry to query VectorService");
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
     * @param  {string} layer slug of layer
     * @param  {object} geomortime  geometry or time that it needs to get (e.g. bboxs)
     * @param  {object} time  start, stop object
     * @return {promise}
     */
    var getData = function (nonLeafLayer, options) {
      var deferred = $q.defer();

      var layer = nonLeafLayer.leafletLayer || deferred.reject();

      if (layer.isLoading) {
        getDataAsync(nonLeafLayer, options, deferred);

      } else if (vectorLayers[nonLeafLayer.slug]) {
        var set = filterSet(vectorLayers[nonLeafLayer.slug].data,
        options.geom, {
          start: options.start,
          end: options.end
        });
        deferred.resolve(set);
      }
      else {
        deferred.reject();
      }

      return deferred.promise;
    };

    var getDataAsync = function (nonLeafLayer, options, deferred) {
      nonLeafLayer.leafletLayer.on('loadend', function () {
        if (vectorLayers[nonLeafLayer.slug] !== undefined) {
          deferred.resolve(filterSet(vectorLayers[nonLeafLayer.slug].data,
            options.geom, {
              start: options.start,
              end: options.end
            }
          ));
        }
      });
    };

    var replaceData = function (layerSlug, data, zoom) {
      vectorLayers[layerSlug] = {
          data: [],
          zoom: zoom
        };
      vectorLayers[layerSlug].data = vectorLayers[layerSlug].data.concat(data);
    };

    var setData = function (layerSlug, data, zoom) {
      if (vectorLayers.hasOwnProperty(layerSlug)
        && vectorLayers[layerSlug].zoom === zoom) {
        vectorLayers[layerSlug].data = vectorLayers[layerSlug].data.concat(data);
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