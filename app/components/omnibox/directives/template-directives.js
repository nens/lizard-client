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
angular.module('lizard-nxt')
  .directive('timeseries', [function () {
  return {
      restrict: 'E',
      scope: {
        timeseries: '=',
      },
      // replace: true,
      templateUrl: 'templates/timeseries.html'
    };
}]);

angular.module('lizard-nxt')
  .directive('cardattributes', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) { scope.wanted = WantedAttributes; },
    restrict: 'E',
    scope: {
      waterchain: '='
    },
    replace: true,
    templateUrl: 'templates/cardattributes.html'
  };
}]);

angular.module('lizard-nxt')
  .directive('rain', [function () {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'templates/rain.html'
  };
}]);

angular.module('lizard-nxt')
  .directive('defaultpoint', ['LanduseLookup',
    function (LanduseLookup) {
  return {
    link: function (scope) { scope.landuseLookup = LanduseLookup; },
    restrict: 'E',
    scope: {
      lg: '=',
      mapstate: '='
    },
    replace: true,
    templateUrl: 'templates/defaultpoint.html'
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
  .directive('location', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/location.html'
  };
}]);

