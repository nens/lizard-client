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


/**
 * Cardtitle directive.
 */
app.directive('cardtitle', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/cardtitle.html'
    };
}]);

/**
 * Event aggregate directive.
 */
app.directive('eventaggregate', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/event-aggregate.html'
    };
}]);
