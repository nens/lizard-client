'use strict';

/**
 * @ngdoc service
 * @name lizardClientApp.locationService
 * @description
 * # locationService
 * Service in the lizardClientApp.
 */
angular.module('omnibox')
  .service('LocationService',
    ['LeafletService', 'CabinetService', 'State',
    function LocationService (LeafletService, CabinetService, State) {

    /**
     * Sends searchstring to geocoder resource.
     * @param  {str} searchString used to query geocoder.
     * @param  {object} spatialState to use in biasing geocoder to current view.
     * @return {promise}
     */
    this.search = function (searchString, spatialState) {
      // TODO: request results in portals language and restrict results based
      // on portal by adding: components: 'country:NL'.
      return CabinetService.geocode.get({
        address: searchString,
        language: 'nl', // Return results in Dutch
        bounds: // Prefer results from the current viewport
          spatialState.bounds.getSouth() + ',' +
          spatialState.bounds.getWest() + '|' +
          spatialState.bounds.getNorth() + ',' +
          spatialState.bounds.getEast()
      });
    };

    /**
     * Zooms to result of geocoder. If result is precise it also simulates a
     * click on the result.
     * @param  {object} result google geocoder result.
     */
    this.zoomToResult = function (result) {
      State.spatial.bounds = LeafletService.latLngBounds(
        LeafletService.latLng(result.geometry.viewport.southwest),
        LeafletService.latLng(result.geometry.viewport.northeast)
      );
      if (result.geometry.location_type === 'ROOFTOP') { // Precise location
        State.spatial.here = LeafletService.latLng(result.geometry.location);
      }
    }

    this.ggStatus = {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        INVALID_REQUEST: 'INVALID_REQUEST',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

  }
]);
