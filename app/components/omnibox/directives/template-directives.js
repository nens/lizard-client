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
      link: function (scope) {

        /**
         * Return the currently selected timeseries if it is one of the
         * available timeseries.
         * @param  {array} timeseries list of available timeseries.
         * @param  {object} current   currently selected ts.
         * @return {object} selected timeseries.
         */
        var getSelectedTS = function (timeseries, current) {
          var selected = {};
          if (current) {
            selected = timeseries.filter(function (ts) {
              return ts.uuid === current.uuid;
            });
          }
          return selected.length > 0 ? selected[0] : timeseries[0];
        };

        scope.$watch('timeseries.data', function () {
          scope.timeseries.selectedTimeseries = getSelectedTS(
            scope.timeseries.data,
            scope.timeseries.selectedTimeseries
          );
        });

      },
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
      state: '=',
      isUrl: '='
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
  .directive('searchResults', [function () {
  return {
    restrict: 'E',
    templateUrl: 'omnibox/templates/search-results.html'
  };
}]);

