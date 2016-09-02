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
        State.selected.assets.addAsset(asset.entity_name + '$' + asset.id);
      });

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
    };

  }]);
