'use strict';

/**
 * @description directive that displays search
 * and makes sure the right services are called.
 */
angular.module('omnibox')
  .directive('search', [
    'LocationService',
    'ClickFeedbackService',
    'MapService',
    'State',
    'UtilService',
  function (LocationService, ClickFeedbackService, MapService, State, UtilService) {

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
          var loc = scope.box.content.location;
          // User hits [enter];
          if (loc && loc.spatial && loc.spatial[0]) {
            scope.zoomTo(scope.box.content.location.spatial[0]);
          }
          else if (loc && loc.temporal) {
            scope.zoomTemporal(scope.box.content.location.temporal);
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
     * @description calls LocationService
     * with the right query and puts in on the scope.
     */
    scope.search = function () {
      scope.box.content.location = {};
      if (scope.query.length > 0) {

        var search = LocationService.search(scope.query, State);
        if (
          search.time.isValid()
          && search.time.valueOf() > UtilService.MIN_TIME
          && search.time.valueOf() < UtilService.MAX_TIME
          ) {
          scope.box.content.location.temporal = search.time;
        } else {
          delete scope.box.content.location.temporal;
          search.geocode
            .then(function (response) {
              if (response.status === LocationService.responseStatus.OK) {
                scope.box.content.location.spatial = response.results;
              }
              else {
                destroyLocationModel();
                if (
                response.status !== LocationService.responseStatus.ZERO_RESULTS
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
    var destroyLocationModel = function () {
      delete scope.box.content.location;
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
      destroyLocationModel();
      scope.cleanInput();
      State = LocationService.zoomToResult(location, State);
    };

    scope.zoomTemporal = function(m) {
      destroyLocationModel();
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

