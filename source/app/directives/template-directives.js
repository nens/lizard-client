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

/**
 * Actions directive.
 */
app.directive('actions', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/actions.html'
  };
}]);

app.directive('cardattributes', ['WantedAttributes', function (WantedAttributes) {
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

app.directive('rain', [function () {
  return {
    link: function (scope) {

      /**
       * Format the CSV (exporting rain data for a point in space/interval in
       * time) in a way that makes it comprehensible for les autres.
       *
       */
      scope.formatCSVColumns = function (data) {
        var i,
          formattedDateTime,
          formattedData = [],
          lat = scope.$parent.mapState.here.lat,
          lng = scope.$parent.mapState.here.lng,
          _formatDate = function (epoch) {

            var d = new Date(parseInt(epoch, 1));

            return [
              [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('-'),
              [d.getHours() || "00", d.getMinutes() || "00", d.getSeconds() || "00"].join(':')
            ];
          };

        for (i = 0; i < data.length; i++) {

          formattedDateTime = _formatDate(data[i][0]);

          formattedData.push([
            formattedDateTime[0],
            formattedDateTime[1],
            Math.floor(100 * data[i][1]) / 100 || "0.00",
            lat,
            lng
          ]);
        }

        return formattedData;
      };
    },
    restrict: 'E',
    scope: {
      rain: '='
    },
    replace: true,
    templateUrl: 'templates/rain.html'
  };
}]);

app.directive('defaultpoint', [function () {
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
    },
    replace: true,
    templateUrl: 'templates/defaultpoint.html'
  };
}]);

app.directive('detailswitch', [function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/detailswitch.html'
  };
}]);
