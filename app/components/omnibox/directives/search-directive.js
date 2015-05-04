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
     * @description event handler for key presses.
     * checks if enter is pressed, does search.
     * @param {event} event that is fired.
     * 13 refers to the RETURN key.
     */
    scope.searchKeyPress = function ($event) {

      if ($event.target.id === "searchboxinput") {
        // Intercept keyPresses *within* searchbox, do xor prevent stuff from happening
        if ($event.which === 13) {
          var loc = scope.box.content.searchResults;
          // User hits [enter];
          if (loc && loc.spatial && loc.spatial[0]) {
            scope.zoomTo(scope.box.content.searchResults.spatial[0]);
          }
          else if (loc && loc.temporal) {
            scope.zoomTemporal(scope.box.content.searchResults.temporal);
          }
          else {
            scope.search();
          }
        } else if ($event.which === 32) {
          // user hits [space] -> prevent anim. start/stop
          $event.originalEvent.stopPropagation();
        } else if ($event.which === 27) { //esc
          scope.cleanInput();
        }
      }
    };

    /**
     *
     */
    scope.search = function () {
      scope.box.content.searchResults = {};
      if (scope.query.length > 0) {
        var search = SearchService.search(scope.query, State);

        if (
          search.time.isValid()
          && search.time.valueOf() > UtilService.MIN_TIME
          && search.time.valueOf() < UtilService.MAX_TIME
          ) {
          scope.box.content.searchResults.temporal = search.time; // moment object.
        }

        else {
          search.geocode
            .then(function (response) {
              // Asynchronous.
              if (scope.box.content.searchResults === undefined) { return; }
              scope.box.content.searchResults.spatial = {};
              if (response.status === SearchService.responseStatus.OK) {
                scope.box.content.searchResults.spatial = response.results;
              }
              // Only destroy asynchronous when following searches did not find
              // a date either.
              else if (scope.box.content.searchResults.temporal === undefined) {
                destroySearchResultsModel();
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

      }
    };

    /**
     * @description removes location model from box content
     */
    var destroySearchResultsModel = function () {
      delete scope.box.content.searchResults;
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
     * @description zooms to search result
     * @param {object} one search result.
     */
    scope.zoomTo = function (location) {
      destroySearchResultsModel();
      scope.cleanInput();
      State = SearchService.zoomToResult(location, State);
    };

    scope.zoomTemporal = function(m) {
      destroySearchResultsModel();
      scope.cleanInput();
      State.temporal.start = m.valueOf();
      State.temporal.end = m.valueOf() + m.nxtInterval.valueOf();
      UtilService.announceMovedTimeline(State);
    };

  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/search.html'
  };

}]);

