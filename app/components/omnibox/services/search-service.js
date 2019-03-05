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
    'notie',
    'gettextCatalog',
    'MapService',
    '$timeout',
    '$rootScope',
    function SearchService (
      $q,
      $http,
      LeafletService,
      CabinetService,
      dateParser,
      DataService,
      notie,
      gettextCatalog,
      MapService,
      $timeout,
      $rootScope
      ) {

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
            url: 'api/v3/search/',
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

          notie.alert(
            3,
            gettextCatalog.getString(
              'Lizard encountered a problem while searching your query.'
            ),
            3
          );
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
            state.spatial.bounds.getWest() + ',' +
            state.spatial.bounds.getSouth() + ',' +
            state.spatial.bounds.getEast() + ',' +
            state.spatial.bounds.getNorth();
      }

      var prom = CabinetService.geocode.get({
        q: searchString,
        bounds: bounds,
        limit: 20 // NB: language is determined from the session by django
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
     * Zooms to result of geocoder.
     *
     * @param  {object} result google geocoder result.
     */

    this.getBounds = function (center) {
      var ruler = cheapRuler(center[0], 'meters');
      var bbox = ruler.bufferPoint(center, 1000);
      // console.log('bbox', bbox);
      // const p1 = L.latLng(bbox[0], bbox[1]);
      // const p2 = L.latLng(bbox[2], bbox[3]);
      var p1 = L.latLng(bbox[1], bbox[0]);
      var p2 = L.latLng(bbox[3], bbox[2]);
    
      return L.latLngBounds(p1, p2);
    };

    this.zoomToGeocoderResult = function (result, state) {
      console.log('zoomToGeocoderResult');
      // if (result.bbox) {
        // console.log('result.bbox', result.bbox);
        // console.log('result.bbox 0', JSON.stringify(state.spatial.bounds));
        state.spatial.bounds = LeafletService.latLngBounds(
          LeafletService.latLng(result.bbox[3], result.bbox[2]),
          LeafletService.latLng(result.bbox[1], result.bbox[0])
        );
      //   console.log(
      //     "bbox bounds",
      //     LeafletService.latLngBounds(
      //       LeafletService.latLng(result.bbox[3], result.bbox[2]),
      //       LeafletService.latLng(result.bbox[1], result.bbox[0])
      //     )
      //   );
      //   // console.log('result.bbox 1', JSON.stringify(state.spatial.bounds));
      //   // MapService._map.panTo(new L.LatLng(result.center[1], result.center[0]));
      //   // state.spatial.bounds = MapService._map.getBounds();
      //   // console.log('map.getBounds()', MapService._map.getBounds());
      //   // console.log('state.spatial.bounds', state.spatial.bounds);
      //   // debugger;
      // } else if (result.center) {
      //   // console.log('result.center 0', JSON.stringify(state.spatial.bounds), result.center);
      //   // MapService._map.panTo(new L.LatLng(result.center[1], result.center[0]));
      //   // // $rootScope.$apply()
      //   // // $timeout(function(){
      //   //   console.log('result.center 1', JSON.stringify(state.spatial.bounds));
      //   //   state.spatial.bounds = MapService._map.getBounds();
      //   //   console.log('result.center 2', JSON.stringify(state.spatial.bounds));
      //   // // });
      //   var bounds = this.getBounds(result.center);
      //   // console.log('boundsbounds', bounds);
      //   state.spatial.bounds = bounds;
      //   console.log(
      //     "center bounds",
      //     bounds
      //   );
      // }  else if (result.geometry && result.geometry.coordinates) {
      //   // console.log('result.geometry.coordinates 0', JSON.stringify(state.spatial.bounds));
      //   // MapService._map.panTo(new L.LatLng(result.geometry.coordinates[1], result.geometry.coordinates[0]));
      //   // $timeout(function(){
      //   //   // console.log('result.geometry.coordinates 1', JSON.stringify(state.spatial.bounds));
      //   //   state.spatial.bounds = MapService._map.getBounds();
      //   //   // console.log('result.geometry.coordinates 2', JSON.stringify(state.spatial.bounds));
      //   // });
        
      // }
      
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
      console.log('service scope.zoomToSearchResult');

      var ZOOM_FOR_OBJECT = 19;

      if (state.box.type !== 'multi-point' && state.context !== 'charts') {
        state.resetObjects();
      }

      state.assets.addAsset(
        result.entity_name + '$' + result.entity_id);

      // If an assetgroup layer is present in the layer menu, but it is not
      // currently active, we activate it to provide consistent UX (i.e. the
      // map and the omnibox are consistent together):
      var assetLayer = _.find(state.layers, function (obj) {
        return obj.type && obj.type.toLowerCase() === 'assetgroup';
      });

      if (assetLayer) {
        assetLayer.active = true;
      }

      state.spatial.view = {
        lat: result.view[0],
        lng: result.view[1],
        zoom: result.view[2] || ZOOM_FOR_OBJECT
      };

      return state;
    };

    /**
     * Zooms to API search result without selecting it.
     *
     * @param {object} result: API search result.
     * @param {object} state: the current state.
     * @return {object} state: the mutated state.
     */
    this.zoomToSearchResultWithoutSelecting = function (result, state) {
      var ZOOM_FOR_OBJECT = 19;

      if (state.box.type !== 'multi-point' && state.context !== 'charts') {
        state.resetObjects();
      }

      state.spatial.view = {
        lat: result.view[0],
        lng: result.view[1],
        zoom: result.view[2] || ZOOM_FOR_OBJECT
      };

      return state;
    };
  }
]);
