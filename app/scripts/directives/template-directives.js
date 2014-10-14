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
      scope: {
        timeseries: '=',
      },
      replace: true,
      templateUrl: 'templates/timeseries.html'
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
    scope: {
      rain: '='
    },
    replace: true,
    templateUrl: 'templates/rain.html'
  };
}]);

angular.module('lizard-nxt')
  .directive('defaultpoint', [function () {
  return {
    link: function (scope) {

      // These layergroups have dedicated markup
      var EXCLUDED = ['timeseries', 'rain', 'waterchain'];

      scope.$watch('point', function () {
        scope.included = [];
        angular.forEach(scope.point, function (value, key) {
          if (EXCLUDED.indexOf(key) === -1) {
            if (value) {
              value.slug = key;
              scope.included.push(value);
            }
          }
        });

      }, true);


    },
    restrict: 'E',
    scope: {
      point: '=',
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
