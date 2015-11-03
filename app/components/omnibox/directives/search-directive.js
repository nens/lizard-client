'use strict';

/**
 * @description directive that displays search
 * and makes sure the right services are called.
 */
angular.module('omnibox')
  .directive('search', [
    'SearchService',
    'ClickFeedbackService',
    'MapService',
    'State',
    'UtilService',
  function (SearchService, ClickFeedbackService, MapService, State, UtilService) {

  var link = function (scope, element, attrs) {

    // Set focus on search input field.
    element.children()[0].focus();

    /**
     * Uses scope.query to search for results through SearchService. Response
     * from SearchService.search is an object with various results and promises.
     *
     * Currently searches for time and addresses.
     *
     * scope.box.content.searchResults is used by search-results template.
     */
    scope.search = function () {
      scope.box.content.searchResults = {};
      if (scope.query.length > 0) {
        var results = SearchService.search(scope.query, State);
        setResultsOnBox(results);
      }
    };

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
    scope.cleanInput = function () {
      State.box.type = "point";
      scope.query = "";
      scope.box.content = {};
      State.spatial.points = [];
      State.spatial.here = undefined;
      ClickFeedbackService.emptyClickLayer(MapService);
    };

    /**
     * @description zooms to geocoder search result
     * @param {object} one search result.
     */
    scope.zoomToSpatialResult = function (location, origin) {
      if (origin === 'timeseries') {
        State = SearchService.zoomToResult(location, State);
      } else {
        destroySearchResultsModel();
        scope.cleanInput();
        State = SearchService.zoomToGoogleGeocoderResult(location, State);
      }
    };

    /**
     * Called by click on temporal result. Cleans results and search box and
     * Zooms to moment.js moment with nxtInterval.
     * @param  {moment} m moment.js moment with nxtInterval as a moment
     *                              duration.
     */
    scope.zoomToTemporalResult = function(m) {
      destroySearchResultsModel();
      scope.cleanInput();
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
      var KEYPRESS = {
        ENTER: 13,
        SPACE: 32,
        ESC: 27
      };

      if ($event.target.id === "searchboxinput") {
        // Intercept keyPresses *within* searchbox,do xor prevent animation
        // from happening when typing.
        if ($event.which === KEYPRESS.ENTER) {
          var loc = scope.box.content.searchResults;
          if (loc && loc.temporal) {
            scope.zoomToTemporalResult(
              scope.box.content.searchResults.temporal
            );
          }
          else if (loc && loc.spatial && loc.spatial[0]) {
            scope.zoomToSpatialResult(
              scope.box.content.searchResults.spatial[0]
            );
          }
          else {
            scope.search();
          }
        } else if ($event.which === KEYPRESS.SPACE) {
          // prevent anim. start/stop
          $event.originalEvent.stopPropagation();
        } else if ($event.which === KEYPRESS.ESC) { //esc
          scope.cleanInput();
        }
      }
    };

    /**
     * Contains the logic to go through search result and puts relevant parts on
     * box scope.
     *
     * When time is a valid moment it is synchronously put on
     * scope.box.content.searchResults.temporal. If time is not valid it waits
     * for spatial results and puts those result on
     * scope.box.content.searchResults.spatial. Prefers temporal results to
     * spatial results.
     *
     * @param {object.promise and object.moment} results
     * moment is a moment.js object
     * promise resolves with response from geocoder.
     */
    var setResultsOnBox = function (results) {
      if (
        results.temporal.isValid()
        && results.temporal.valueOf() > UtilService.MIN_TIME
        && results.temporal.valueOf() < UtilService.MAX_TIME
        ) {
        scope.box.content.searchResults.temporal = results.temporal;
        // moment object.
      }

      else {
        results.spatial
          .then(function (response) {
            // Asynchronous so check whether still relevant.
            if (scope.box.content.searchResults === undefined) { return; }

            // Either put results on scope or remove model.
            if (response.status === SearchService.responseStatus.OK) {
              var results = response.results;
              // limit to 5 results
              if (results.length > 5) {
                results = results.splice(0, 5)
              }
              scope.box.content.searchResults.spatial = results;
            }
            // Only destroy asynchronous when following searches did not find
            // a date either.
            else if (scope.box.content.searchResults.temporal === undefined) {
              //destroySearchResultsModel();

              if (
                response.status !== SearchService.responseStatus.ZERO_RESULTS
              ) {
                // Throw error so we can find out about it through sentry.
                throw new Error(
                  'Geocoder returned with status: ' + response.status
                );
              }

            }
          }
        );
      }
      results.search
        .then(function (response) {
          // Asynchronous so check whether still relevant.
          if (scope.box.content.searchResults === undefined) { return; }
          scope.box.content.searchResults.search = response.results;
        }
      );
    };

    /**
     * @description removes location model from box content
     */
    var destroySearchResultsModel = function () {
      delete scope.box.content.searchResults;
    };

  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/search.html'
  };

}]);

