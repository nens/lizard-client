/**
 * Template directives.
 *
 * * Event
 * * Timeseries
 * * Streetview
 * * Cardtitle
 * * Event aggregation
 * * Actions
 * * Cardattributes
 * * Detailswitch
 *
 */

/**
 * Event directive.
 */
angular.module('lizard-nxt')
  .directive('event', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/event.html'
    };
}]);

/**
 * Timeseries directive.
 */
angular.module('lizard-nxt')
  .directive('timeseries', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/timeseries.html'
    };
}]);

/**
 * Streetview directive.
 */
angular.module('lizard-nxt')
  .directive('streetview', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/streetview.html'
    };
}]);


/**
 * Cardtitle directive.
 */
angular.module('lizard-nxt')
  .directive('cardtitle', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/cardtitle.html'
    };
}]);

/**
 * Event aggregate directive.
 */
angular.module('lizard-nxt')
  .directive('eventaggregate', [function () {
  return {
      restrict: 'E',
      templateUrl: 'templates/event-aggregate.html'
    };
}]);

/**
 * Actions directive.
 */
angular.module('lizard-nxt')
  .directive('actions', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/actions.html'
  };
}]);

angular.module('lizard-nxt')
  .directive('cardattributes', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/cardattributes.html'
  };
}]);

angular.module('lizard-nxt')
  .directive('detailswitch', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/detailswitch.html'
  };
}]);

angular.module('lizard-nxt')
  .directive('datadetailcard', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/data-detail-card.html'
  };
}]);

angular.module('lizard-nxt')
  .directive('dataaggregationcard', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/data-aggregation-card.html'
  };
}]);