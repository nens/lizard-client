'use strict';

/**
 * @ngdoc service
 * TODO : doc
 * @class NxtMap /
 * @memberof app
 * @name NxtMap
 * @requires LeafletService
 * @summary stores the map
 * @description  NxtMap service encapsulates all kinds of helper functions
 * for the map-directive. A wrapper of sorts for Leaflet stuff,
 * the map object and mapState.
 */

angular.module('lizard-nxt')
  .Factory('DataService', ['dataLayers', 'NxtData', 'MapService',
    function (dataLayers, NxtData, MapService) {
      return new NxtData(dataLayers, MapService.map);
    }
  ]);