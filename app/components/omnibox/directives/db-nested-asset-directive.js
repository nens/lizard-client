/**
 *
 * Adds and removes nested assets to State
 *
 */
angular.module('omnibox')
.directive('dbNestedAsset', [
  'getNestedAssets',
  'State',
  function (getNestedAssets, State) {

    var link = function (scope, element, attrs) {
      var nestedAssets = getNestedAssets(scope.asset);

      nestedAssets.forEach(function (asset) {
        asset.name = scope.asset.name;
        State.assets.addAsset(asset.entity_name + '$' + asset.id);
      });

      scope.$watch('asset', function () {
        scope.list = getNestedAssets(scope.asset);
        scope.asset.selectedAsset = scope.list[0];

        scope.list = scope.list.map(function (asset) {
          asset.name = scope.asset.name;
          State.assets.addAsset(asset.entity_name + '$' + asset.id);
          return asset;
        });
      });
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        asset: '=',
        timeState: '='
      },
      templateUrl: 'omnibox/templates/db-nested-asset-card.html'
    };

  }]);
