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
    '$q',
    '$http',
    'LeafletService',
    'CabinetService',
    'DateParser',
    'DataService',
    'MapService',
    'notie',
    function SearchService (
      $q,
      $http,
      LeafletService,
      CabinetService,
      dateParser,
      DataService,
      MapService,
      notie
      ) {

    this.responseStatus = {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        INVALID_REQUEST: 'INVALID_REQUEST',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    var localPromise = {};

    this.cancel = function () {
      if (localPromise.resolve) {
        localPromise.resolve({data: {results: []}});
      }
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

      var getSearch = function (params) {

        var MINIMUM_SEARCH_QUERY_LENGTH = 3;

        // Cancel consecutive calls.
        if (localPromise.resolve) {
          localPromise.resolve({data: {results: []}});
        }

        localPromise = $q.defer();

        // Only send request if searchstring is longer than 2.
        // Otherwise return zero relevant searches.
        if (params.q.length >= MINIMUM_SEARCH_QUERY_LENGTH) {
          return $http({
            url: 'api/v2/search/',
            method: 'GET',
            params: params,
            timeout: localPromise.promise
          })
          .then(function (response) {
            return response.data;
          }, errorFn);
        }
        else {
          localPromise.resolve({results: []});
          return localPromise.promise;
        }
      };

      var errorFn = function (err) {
        if (err.status === 420 || err.status === -1) {
          // Cancel normal operations
          return $q.reject(err);
        }
        else if (err.status >= 500 && err.status < 600) {
          notie.alert(3, 'Lizard encountered a problem while searching your query.', 3);
          // Cancel normal operations
          return $q.reject(err);
        }
        window.Raven.captureException(err);
        return err; // continue anyway
      };

      var bounds;
      // bounds are not available in the dashboard view.
      if (state.spatial.bounds.getSouth) {
          bounds = // Prefer results from the current viewport
            state.spatial.bounds.getSouth() + ',' +
            state.spatial.bounds.getWest() + '|' +
            state.spatial.bounds.getNorth() + ',' +
            state.spatial.bounds.getEast();
      }
      // TODO: request results in portals language and restrict results based
      // on portal by adding: components: 'country:NL'.
      var prom = CabinetService.geocode.get({
        address: searchString,
        language: state.language, // Preferred language of search results.
        bounds: bounds
      });

      var moment = dateParser(searchString);

      var search = getSearch({
        q: searchString
      });

      return {
        search: search,
        spatial: prom,
        temporal: moment
      };
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

    /**
     * Zooms to API search result. If the box type is multi-point add the
     * selected search result to the other selected points, otherwise replace
     * the currently selected point.
     *
     * @param {object} result: API search result.
     * @param {object} state: the current state.
     * @return {object} state: the new state.
     */
    this.zoomToSearchResult = function (result, state) {
      var ZOOM_FOR_OBJECT = 19;

      if (state.box.type !== 'multi-point' && state.context !== 'dashboard') {
        state.selected.reset();
      }

      state.selected.assets.addAsset(
        result.entity_name + '$' + result.entity_id);

      MapService.setView({
        lat: result.view[0],
        lng: result.view[1],
        zoom: result.view[2] || ZOOM_FOR_OBJECT
      });

      return state;
    };

    /**
     * Zooms to API search result without selecting it.
     *
     * @param {object} result: API search result.
     * @param {object} state: the current state.
     * @return {object} state: the new state.
     */
    this.zoomToSearchResultWithoutSelecting = function (result, state) {
      var ZOOM_FOR_OBJECT = 19;

      if (state.box.type !== 'multi-point' && state.context !== 'dashboard') {
        state.selected.reset();
      }

      MapService.setView({
        lat: result.view[0],
        lng: result.view[1],
        zoom: result.view[2] || ZOOM_FOR_OBJECT
      });

      return state;
    };
  }
]);
