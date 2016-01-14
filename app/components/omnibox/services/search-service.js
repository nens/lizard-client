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
    [
    'LeafletService',
    'CabinetService',
    'DateParser',
    'DataService',
    'MapService',
    function SearchService (
      LeafletService,
      CabinetService,
      dateParser,
      DataService,
      MapService
      ) {

    this.responseStatus = {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        INVALID_REQUEST: 'INVALID_REQUEST',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    /**
     * Sends searchstring to date parser and geocoder resource.
     *
     * @param  {str} searchString used to query geocoder and parse date.
     * @param  {object} spatialState to use in biasing geocoder to current view.
     * @return {object} object with moment and promise
     *                        moment is a moment.js object
     *                        promise resolves with response from geocoder.
     */
    this.search = function (searchString, state) {
      // TODO: request results in portals language and restrict results based
      // on portal by adding: components: 'country:NL'.
      var prom = CabinetService.geocode.get({
        address: searchString,
        language: state.language, // Preferred language of search results.
        bounds: // Prefer results from the current viewport
          state.spatial.bounds.getSouth() + ',' +
          state.spatial.bounds.getWest() + '|' +
          state.spatial.bounds.getNorth() + ',' +
          state.spatial.bounds.getEast()
      });
      var moment = dateParser(searchString);

      var search = CabinetService.search.get({
        q: searchString
      });

      return {
        search: search,
        spatial: prom,
        temporal: moment
      };
    };


    /**
     * Add result of API searchendpoint to selection.
     * @param  {object} result search result.
     */
    this.zoomToResult = function (result, state) {

      var asset = result.location.object;

      if (asset.type && asset.id) {
        state.selected.assets.addAsset(asset.type + '$' + asset.id);
      }

      return state;
    };

    this.filter = function (results, filterKey) {
      return results.filter(function (item) {
        return item.search_result_type === filterKey;
      });
    };


    this.openLayerGroup = function (result) {
      if (!result.lg) {
        result.lg = DataService.createLayerGroup(result);
      }
      if (result.lg) {
        DataService.toggleLayerGroup(result.lg);
        if (result.lg.spatialBounds) {
          MapService.fitBounds(result.lg.spatialBounds);
        }

      }
    };

    /**
     * Zooms to result of geocoder. If result is precise it also simulates a
     * click on the result.
     * @param  {object} result google geocoder result.
     */
    this.zoomToGoogleGeocoderResult = function (result, state) {
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
