
angular.module('omnibox')
  .directive('dbAssetCard', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) {
      scope.wanted = WantedAttributes;

      console.log(scope.id);

    },
    restrict: 'E',
    scope: {
      id: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/db-asset-card.html'
  };
}]);
