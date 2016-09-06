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
      // console.log(nestedAssets, 'moet toch filters bevattten?', scope.asset.filters)

      nestedAssets.forEach(function (asset) {
        asset.name = scope.asset.name;
        State.selected.assets.addAsset(asset.entity_name + '$' + asset.id);
      });

      scope.$watch('asset', function () {
        scope.list = getNestedAssets(scope.asset);
        scope.asset.selectedAsset = scope.list[0];

        scope.list = scope.list.map(function (asset) {
          asset.name = scope.asset.name;
          console.log(scope.asset.name, asset.name)
          State.selected.assets.addAsset(asset.entity_name + '$' + asset.id);
          return asset;
        });
      })

      scope.$on('$destroy', function () {
        nestedAssets.forEach(function (asset) {
          var assetId = asset.entity_name + '$' + asset.id;
          var i = State.selected.assets.indexOf(assetId);
          if (i !== -1) {
            State.selected.assets.removeAsset(assetId);
          }
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
