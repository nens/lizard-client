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
  .service('VectorService', ['$q', '$rootScope', 'LeafletService',
  function ($q, $rootScope, LeafletService) {

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
     * @function
     * @description filters geojson array on temporal bounds.
     * @param  {object}      start end object
     * @param  {feature[]}   sourceArray
     * @return {filteredSet} filtered set of features.
     */
    var filterTemporal = function (sourceArray, temporal) {

      var filteredSet = [],
          eventStartBeforeTLStart,
          eventStartAfterTLStart,
          eventEndBeforeTLStart,
          eventEndAfterTLStart,
          eventEndBeforeTLEnd;

      sourceArray.forEach(function (feature) {

        eventStartBeforeTLStart = false;
        eventStartAfterTLStart = false;
        eventEndBeforeTLStart = false;
        eventEndAfterTLStart = false;
        eventEndBeforeTLEnd = false;

        if (temporal.start) {
          // we can set the 4 booleans related to ..TLStart:
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
            = feature.properties.timestamp_end < temporal.end;// chk
        }

        // We process the feature iff one of the following is true:

        // (1) The event starts before tl start && the event ends after tl start:
        //                      <--extent-->
        // kruik <----------oooo[oooo------]--------------------> eind der tijd
        // kruik <----------oooo[oooooooooo]oooo----------------> eind der tijd
        if (eventStartBeforeTLStart
            && eventEndAfterTLStart) { filteredSet.push(feature); }

        // (2) The event starts within tl bounds:
        //                      <--extent-->
        // kruik <--------------[--oooooooo]oooo----------------> eind der tijd
        // kruik <--------------[--oooooo--]--------------------> eind der tijd

        // Explicit code for (2) is redundant when viewing code for (3): since
        // (3) |= (2) (see table)

        //  A B C D | A and B | (A or C) and (B or D)
        //  --------+---------+----------------------
        //  0 0 0 0 |    0    |     0     0     0
        //  0 0 0 1 |    0    |     0     0     1
        //  0 0 1 0 |    0    |     1     0     0
        //  0 0 1 1 |    0    |     1     1     1
        //  0 1 0 0 |    0    |     0     0     1
        //  0 1 0 1 |    0    |     0     0     1
        //  0 1 1 0 |    0    |     1     1     1
        //  0 1 1 1 |    0    |     1     1     1
        //  --------+---------+-----------------------
        //  1 0 0 0 |    0    |     1     0     0
        //  1 0 0 1 |    0    |     1     1     1
        //  1 0 1 0 |    0    |     1     0     0
        //  1 0 1 1 |    0    |     1     1     1
        //  1 1 0 0 |    1    |     1     1     1
        //  1 1 0 1 |    1    |     1     1     1
        //  1 1 1 0 |    1    |     1     1     1
        //  1 1 1 1 |    1    |     1     1     1

        // unused code for (2), for explicitness' sake:
        // else if (eventStartAfterTLStart
        //          && eventStartBeforeTLEnd) { filteredSet.push(feature); }

        // 3) Also, deal with undefined start/end values:
        else if (
                  (temporal.start === undefined || eventStartAfterTLStart)
                  && (temporal.end === undefined || eventEndBeforeTLEnd)
                )
                { filteredSet.push(feature); }

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
      } else if (spatial instanceof Array
        && spatial[0] instanceof LeafletService.LatLng) {
        // TODO: implement line intersect with vector data
        filteredSet = [];
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
     * @param  {layer} layer as defined by layer-service
     * @param  {object} geomortime  geometry or time that it needs to get (e.g. bboxs)
     * @param  {object} time  start, stop object
     * @return {promise}
     */
    var getData = function (nonLeafLayer, options) {
      var deferred = $q.defer(),
          layerSlug, layer;

      // leaflet knows nothing, so sends slug and leaflayer
      if (typeof nonLeafLayer === 'string') {
        layerSlug = nonLeafLayer;
        layer = options.layer;
      } else {
        layer = nonLeafLayer._leafletLayer;
        layerSlug = nonLeafLayer.slug;
      }

      if (!layer) {
        deferred.reject();
        return deferred.promise;
      }


      if (layer.isLoading) {
        getDataAsync(layerSlug, layer, options, deferred);
      } else if (vectorLayers[layerSlug]) {
        var set = filterSet(vectorLayers[layerSlug].data,
        options.geom, {
          start: options.start,
          end: options.end
        });
        deferred.resolve(set);
      } else if (!vectorLayers[layerSlug]) {
        // Store that there is no data for this layer
        vectorLayers[layerSlug] = {
          data: []
        };
      } else {
        deferred.reject();
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
      layer.on('loadend', function () {
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
    var getUnion = function (arr1, arr2, uniqueKey) {
      var union = arr1;
      var ids = [];

      for (var j = 0; j < union.length; j++) {
        ids.push(union[j].properties[uniqueKey]);
      }

      for (var i = 0; i < arr2.length; i++) {
        if (ids.indexOf(arr2[i].properties[uniqueKey]) < 0) {
          union.push(arr2[i]);
        }
      }
      return union;
    };

    /**
     * @description appends data if zoom level hasn't changed
     *
     */
    var setData = function (layerSlug, data, zoom) {
      if (vectorLayers.hasOwnProperty(layerSlug)
        && vectorLayers[layerSlug].zoom === zoom) {
        vectorLayers[layerSlug].data = getUnion(vectorLayers[layerSlug].data, data, 'id');
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
