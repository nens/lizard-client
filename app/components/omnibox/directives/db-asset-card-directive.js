
angular.module('omnibox')
  .directive('dbAssetCard', [ '$http', 'WantedAttributes', 'TimeseriesService',
    function ($http, WantedAttributes, TimeseriesService) {
  return {
    link: function (scope) {
      scope.wanted = WantedAttributes;
      scope.asset = {};

      scope.$watch('assetId', function () {
        var entity = scope.assetId.split('$')[0];
        var id = scope.assetId.split('$')[1];

        $http({
          url: 'api/v2/' + entity + 's' + '/' + id + '/',
          method: 'GET'
        })

        .then(function (response) {
          response.data.entity_name = entity;
          scope.asset = response.data;
        });

        TimeseriesService.getTimeSeriesForObject(scope.assetId)

        .then(function(response) {
          scope.ts = response.results;
        });

     });

    },
    restrict: 'E',
    scope: {
      assetId: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/db-asset-card.html'
  };
}]);
