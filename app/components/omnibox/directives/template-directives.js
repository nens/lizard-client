/**
 * Template directives.
 *
 * * Timeseries
 * * Cardtitle
 * * Event aggregation
 * * Actions
 * * Cardattributes
 * * Detailswitch
 *
 */

/**
 * Timeseries directive.
 */
angular.module('omnibox')
  .directive('timeseries', [function () {
  return {
      restrict: 'E',
      scope: {
        fullDetails: '=',
        timeseries: '=',
        timeState: '='
      },
      // replace: true,
      templateUrl: 'omnibox/templates/timeseries.html'
    };
}]);

angular.module('omnibox')
  .directive('cardattributes', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) { scope.wanted = WantedAttributes; },
    restrict: 'E',
    scope: {
      fullDetails: '=',
      waterchain: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/cardattributes.html'
  };
}]);

angular.module('omnibox')
  .directive('rain', [function () {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/rain.html'
  };
}]);

angular.module('omnibox')
  .directive('defaultpoint', [function () {
  return {
    restrict: 'E',
    scope: {
      lg: '=',
      state: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/defaultpoint.html'
  };
}]);

angular.module('omnibox')
  .directive('detailswitch', [function () {
  return {
    restrict: 'E',
    templateUrl: 'omnibox/templates/detailswitch.html'
  };
}]);

angular.module('omnibox')
  .directive('location', [function () {
  return {
    restrict: 'E',
    templateUrl: 'omnibox/templates/location.html'
  };
}]);

