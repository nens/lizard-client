'use strict';

/**
 * @description directive that displays search
 * and makes sure the right services are called.
 */
angular.module('omnibox')
  .directive('search', [
    'SearchService',
    'ClickFeedbackService',
    'State',
    'UtilService',
    '$timeout',
  function (SearchService, ClickFeedbackService, State, UtilService, $timeout) {

  var link = function (scope, element, attrs) {

    scope.omnibox.searchResults = {};
    scope.omnibox.mustShowSearchResults = true;

    scope.util = UtilService;
    scope.query = '';

    var KEYPRESS = {
      BACKSPACE: 8,
      ENTER: 13,
      SPACE: 32,
      ESC: 27,
      ARROWUP: 38,
      ARROWDOWN: 40
    };
    var ZOOM_FOR_OBJECT = 16;

    // Set focus on search input field.
    element.children()[0].focus();

    /**
     * Uses scope.query to search for results through SearchService. Response
     * from SearchService.search is an object with various results and promises.
     *
     * Currently searches for time and addresses.
     *
     * scope.omnibox.searchResults is used by search-results template.
     */
    var _search = function () {
      scope.omnibox.mustShowSearchResults = true;
      scope.omnibox.searchResults = {};
      if (scope.query.length > 0) {
        var results = SearchService.search(scope.query, State);
        setResultsOnBox(results);
      } else {
        scope.cleanInputAndResults();
      }
    };

    scope._search = _search; // For unit tests
    scope.search = _.debounce(_search, 500);

    /**
     * @description resets input field
     * on scope, because also needs to trigger on reset button,
     * not just on succesful search/zoom.
     *
     * @description - This does the following:
     *
     * (1) - Reset box.type to it's default value, "point";
     * (2) - Reset the search query to the empty string;
     * (3) - Reset box.content to an empty object;
     * (4) - Clear mapState.points arr (used for updating the Url);
     * (5) - Clear the click feedback.
     */
    scope.cleanInputAndResults = function () {
      SearchService.cancel();
      scope.query = "";
      scope.omnibox.searchResults = {};
      scope.omnibox.mustShowSearchResults = false;
    };

    /**
     * @description - Returns true when either (i) a query is currently (being)
     *                entered in the text input-field or (ii) there are more
     *                than 0 (spatial) search-results available.
     */
    scope.mayCleanInputAndResults = function () {
      return scope.query || (
        scope.omnibox &&
        scope.omnibox.searchResults && (
          (
            scope.omnibox.searchResults.spatial &&
            scope.omnibox.searchResults.spatial.length
          ) || (
            scope.omnibox.searchResults.api &&
            scope.omnibox.searchResults.api.length
          ) || (
            scope.omnibox.searchResults.temporal &&
            scope.omnibox.searchResults.temporal.length
          )
        )
      );
    };

    /**
     * @description zooms to search resulit
     * @param {object} one search result.
     */
    scope.zoomToSearchResult = function (result) {
      State = SearchService.zoomToSearchResult(result, State);
      scope.cleanInputAndResults();
    };

        /**
     * @description zooms to search result without clearing search or selecting the item.
     * @param {object} one search result.
     */
    scope.zoomToSearchResultWithoutClearingSearch = function (result) {
      State = SearchService.zoomToSearchResultWithoutSelecting(result, State);
    };

    /**
     * @description zooms to geocoder search result
     * @param {object} one search result.
     */
    scope.zoomToSpatialResult = function (result) {
      State = SearchService.zoomToGeocoderResult(result, State);
      scope.cleanInputAndResults();
    };

    /**
     * @description zooms to geocoder search result without clearing search
     * @param {object} one search result.
     */
    scope.zoomToSpatialResultWithoutClearingSeach = function (result) {
      State = SearchService.zoomToGeocoderResult(result, State);
    };

    /**
     * Called by click on temporal result. Cleans results and search box and
     * Zooms to moment.js moment with nxtInterval.
     * @param  {moment} m moment.js moment with nxtInterval as a moment
     *                              duration.
     */
    scope.zoomToTemporalResult = function (m) {
      scope.omnibox.mustShowSearchResults = false;
      scope.omnibox.searchResults = {};
      scope.query = "";
      State.temporal.start = m.valueOf();
      State.temporal.end = m.valueOf() + m.nxtInterval.valueOf();
      UtilService.announceMovedTimeline(State);
    };

    /**
     * @description event handler for key presses.
     * checks if enter is pressed, does search.
     * @param {event} event that is fired.
     * 13 refers to the RETURN key.
     */
    scope.searchKeyPress = function ($event) {

      if ($event.target.id === "searchboxinput") {
        // Intercept keyPresses *within* searchbox,do xor prevent animation
        // from happening when typing.

        if ($event.which === KEYPRESS.ESC) {
          scope.cleanInputAndResults();
        }

        else if ($event.which === KEYPRESS.SPACE) {
          // prevent anim. start/stop
          $event.originalEvent.stopPropagation();
        }

        else if ($event.which === KEYPRESS.ENTER) {
          var results = scope.omnibox.searchResults;
          if (results.temporal || results.spatial || results.api) {
            if (results.temporal) {
              scope.zoomToTemporalResult(results.temporal);
            } else if (results.spatial) {
              scope.zoomToSpatialResult(results.spatial[0]);
            } else if (results.api) {
              scope.zoomToSearchResult(results.api[0]);
            }

            scope.cleanInputAndResults();
          }
        }
      }
    };


    /**
     * Contains the logic to go through search result and puts relevant parts on
     * box scope.
     *
     * When time is a valid moment it is synchronously put on
     * scope.omnibox.searchResults.temporal. If time is not valid it waits
     * for spatial results and puts those result on
     * scope.omnibox.searchResults.spatial. Prefers temporal results to
     * spatial results.
     *
     * @param {object} results object, with moment and promise
     * moment is a moment.js object
     * promise resolves with response from geocoder.
     */
    var setResultsOnBox = function (results) {
      if (
        results.temporal.isValid()
        && results.temporal.valueOf() > UtilService.MIN_TIME
        && results.temporal.valueOf() < UtilService.MAX_TIME
        ) {
        scope.omnibox.searchResults.temporal = results.temporal;
        // moment object.
      }

      else {
        results.spatial
          .then(function (response) {
            // Asynchronous so check whether still relevant.
            if (scope.omnibox.searchResults === undefined) { return; }

            // Either put results on scope or remove model.
            if ("features" in response) {
              var features = response.features;
              scope.omnibox.searchResults.spatial = features;
            }
            else {
              // Throw error so we can find out about it through sentry.
              throw new Error(
                'Mapbox geocoder returned with status: ' + response.message
              );
            }

          }
        );
      }

      results.search
        .then(function (response) {
          // Asynchronous so check whether still relevant.
          if (scope.omnibox.searchResults === undefined) { return; }
          if (response.results.length) {
            scope.omnibox.searchResults.api = response.results;
          }
        }
      );
    };

    /**
     * Placeholder attr's can not get translated like the rest of the strings
     * appearing in the DOM. Therefore, a beauti-fool hack:
     */
    scope.setSearchBoxPlaceholder = function () {
      if (window.location.href.indexOf("/nl/") > -1) {
        // Apparently, we want dutch placeholder:
        return "Zoek naar plaatsen, of datums (i.e. 23-10-2013)";
      } else {
        // Apparently, we want english (default) placeholder:
        return "Search for places, or dates (i.e. 23-10-2013)";
      }
    };

    /**
     * @description removes location model from box content
     */
    var destroySearchResultsModel = function () {
      delete scope.omnibox.searchResults;
    };

  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/search.html'
  };

}]);
