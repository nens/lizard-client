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

    this.search = function (searchString, spatialState) {
      if (searchString.length > 1) {
        return CabinetService.geocode.get({
          address: searchString,
          language: 'nl',
          bounds:
            spatialState.bounds.getSouth() + ',' +
            spatialState.bounds.getWest() + '|' +
            spatialState.bounds.getNorth() + ',' +
            spatialState.bounds.getEast()
        });
      }
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
        ok: 'OK',
        zeroResults: 'ZERO_RESULTS',
        overQueryLimits: 'OVER_QUERY_LIMIT',
        requestDenied: 'REQUEST_DENIED',
        invalidRequest: 'INVALID_REQUEST',
        unknown: 'UNKNOWN_ERROR'
    };

  }
]);
