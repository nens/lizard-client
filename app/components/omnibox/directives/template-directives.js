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
      fullDetails: '=',
      waterchain: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/cardattributes.html'
  };
}]);

angular.module('omnibox')
  .directive('nestedasset', ['WantedAttributes', 'DataService',
    function (WantedAttributes, DataService) {
  return {
    link: function (scope) {

      scope.wanted = WantedAttributes;

      scope.$watch('asset', function () {
        scope.attr = scope.asset.pumps ? 'pump' : 'filter';
        scope.assetList = JSON.parse(scope.asset[scope.attr + 's']);
        // Put currently selected nested asset on the box scope to be accessed
        // by timeseries directive.
        scope.$parent.currentNestedAsset = scope.assetList[0];
      });

    },
    restrict: 'E',
    scope: {
      fullDetails: '=',
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

