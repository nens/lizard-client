
angular.module('omnibox')
  .directive('dbAssetCard', [ '$http', 'WantedAttributes', 'TimeseriesService',
    function ($http, WantedAttributes, TimeseriesService) {
  return {
    link: function (scope) {
      scope.wanted = WantedAttributes;

      var assetId = scope.asset.entity_name + '$' + scope.asset.id;

      TimeseriesService.getTimeSeriesForObject(assetId)

      .then(function(response) {
        scope.ts = response.results;
      });

    },
    restrict: 'E',
    scope: {
      asset: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/db-asset-card.html'
  };
}]);
