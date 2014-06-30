/**
 * Template directives.
 *
 * * Event
 * * Timeseries
 * * Streetview
 *
 */

/**
 * Event directive.
 */
app.directive('event', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/event.html'
    };
}]);

/**
 * Timeseries directive.
 */
app.directive('timeseries', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/timeseries.html'
    };
}]);

/**
 * Streetview directive.
 */
app.directive('streetview', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/streetview.html'
    };
}]);
