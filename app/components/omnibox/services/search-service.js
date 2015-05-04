'use strict';

/**
 * @ngdoc service
 * @name lizardClientApp.SearchService
 * @description
 * # SearchService
 * Service in the lizardClientApp.
 */
angular.module('omnibox')
  .service('SearchService',
    ['LeafletService', 'CabinetService', 'DateParser',
    function SearchService (LeafletService, CabinetService, dateParser) {

    this.responseStatus = {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        INVALID_REQUEST: 'INVALID_REQUEST',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    /**
     * Sends searchstring to geocoder resource.
     * @param  {str} searchString used to query geocoder.
     * @param  {object} spatialState to use in biasing geocoder to current view.
     * @return {promise}
     */
    this.search = function (searchString, state) {
      // TODO: request results in portals language and restrict results based
      // on portal by adding: components: 'country:NL'.
      var prom = CabinetService.geocode.get({
        address: searchString,
        language: 'nl', // Return results in Dutch
        bounds: // Prefer results from the current viewport
          state.spatial.bounds.getSouth() + ',' +
          state.spatial.bounds.getWest() + '|' +
          state.spatial.bounds.getNorth() + ',' +
          state.spatial.bounds.getEast()
      });
      var moment = dateParser(searchString);
      return {
        geocode: prom,
        time: moment
      };
    };

    /**
     * Zooms to result of geocoder. If result is precise it also simulates a
     * click on the result.
     * @param  {object} result google geocoder result.
     */
    this.zoomToResult = function (result, state) {
      state.spatial.bounds = LeafletService.latLngBounds(
        LeafletService.latLng(result.geometry.viewport.southwest),
        LeafletService.latLng(result.geometry.viewport.northeast)
      );
      if (result.geometry.location_type === 'ROOFTOP') { // Precise location
        state.spatial.here = LeafletService.latLng(result.geometry.location);
      }
      return state;
    };

  }
]);
