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
angular.module('omnibox')
  .directive('cardattributes', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) { scope.wanted = WantedAttributes; },
    restrict: 'E',
    scope: {
      waterchain: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/cardattributes.html'
  };
}]);

angular.module('omnibox')
  .directive('cardheader', ['UtilService',
    function (UtilService) {
  return {
    link: function (scope) {
      scope.getIconClass = UtilService.getIconClass;
    },
    restrict: 'E',
    scope: {
      asset: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/card-header.html'
  };
}]);



angular.module('omnibox')
  .directive('summaryCard', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) { scope.wanted = WantedAttributes; },
    restrict: 'E',
    scope: {
      asset: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/summary-card.html'
  };
}]);


angular.module('omnibox')
  .directive('nestedasset', ['WantedAttributes', 'DataService',
    function (WantedAttributes, DataService) {
  return {
    link: function (scope) {

      scope.wanted = WantedAttributes;

      /**
       * Watch asset unpack json string, add entity name and select first child
       * asset.
       */
      scope.$watch('asset', function () {
        scope.attr = scope.asset.pumps ? 'pump' : 'filter';
        scope.list = JSON.parse(scope.asset[scope.attr + 's']);
        angular.forEach(scope.list, function (asset) {
          asset.entity_name = scope.attr;
        });
        scope.asset.selectedAsset = scope.list[0];
      });

    },
    restrict: 'E',
    scope: {
      asset: '=',
    },
    replace: true,
    templateUrl: 'omnibox/templates/nestedasset.html'
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
