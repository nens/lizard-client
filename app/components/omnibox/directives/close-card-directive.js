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
  function (State, DataService) {

    var link = function (scope, element, attrs) {

      /**
       * Removes asset from global State.
       *
       * Requires entity and id of asset on scope.
       */
      scope.rmAssetOrGeometry = function () {
        if (scope.geometry) {
          State.selected.geometries.removeGeometry(scope.geometry);
        }

        else if (scope.entity && scope.id) {
          var assetId = scope.entity + '$' + scope.id;

          var asset = _.find(DataService.assets, function (asset) {
            return asset.entity_name === scope.entity
              && asset.id === scope.id;
          });

          // Remove all the selected timeseries of this asset.
          State.selected.timeseries = _.filter(State.selected.timeseries,
            function (uuid) {
              var keep = true;
              _.forEach(asset.timeseries, function (ts) {
                if (ts.uuid === uuid) {
                  // This selected timeseries is one of the asset that is removed.
                  // cancel loop and return false to remove ts from selection.
                  keep = false;
                  return false;
                }
              });
              return keep;
            }
          );

          // Remove the asset from the selection.
          var selectedAssets = State.selected.assets;
          if (State.selected.assets.indexOf(assetId) >= 0) {
            selectedAssets.removeAsset(assetId);
          }

        }
      };

    };


    return {
      link: link,
      restrict: 'E',
      scope: {
        entity: '=',
        id: '=',
        geometry: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/close-card.html'
    };

  }]);

