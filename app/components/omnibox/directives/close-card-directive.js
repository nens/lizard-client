/**
 *
 * Removes asset from selection
 *
 * TODO: this directive or an attribute directive should be responsible for
 * making the card small when there is not enough space.
 *
 * TODO 2: use ng-click so we do not have to worry about running a digest cycle
 * manually.
 */
angular.module('omnibox')
.directive('closeCard', [
  'State',
  'DataService',
  'TimeseriesService',
  function (State, DataService, TimeseriesService) {

    var link = function (scope, element, attrs) {

      /**
       * Removes asset from global State.
       *
       * Requires entity and id of asset on scope.
       */
      scope.rmAssetOrGeometry = function () {
        if (scope.geometry) {
          State.geometries.removeGeometry(scope.geometry);
        } else if (scope.asset) {
          var assetId = scope.asset.entity_name + '$' + scope.asset.id;
          // Remove the asset from the selection.
          var selectedAssets = State.assets;
          if (selectedAssets.indexOf(assetId) >= 0) {
            selectedAssets.removeAsset(assetId);
          }

        }
      };

    };


    return {
      link: link,
      restrict: 'E',
      scope: {
        asset: '=',
        geometry: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/close-card.html'
    };

  }]);

