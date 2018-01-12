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
  'getNestedAssets',
  'TimeseriesService',
  'DashboardChartService',
  function (State, DataService, getNestedAssets, TimeseriesService, DashboardChartService) {

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

          // Remove the nested assets (for local scope.asset)
          getNestedAssets(scope.asset).forEach(function (asset) {
            var assetId = asset.entity_name + '$' + asset.id;
            var i = State.assets.indexOf(assetId);
            if (i !== -1) {
              DashboardChartService.deleteChartsForAsset(assetId);
              State.assets.removeAsset(assetId);
            }
          });

          // Remove the asset itself (for local scope.asset)
          var selectedAssets = State.assets;
          if (selectedAssets.indexOf(assetId) >= 0) {
            DashboardChartService.deleteChartsForAsset(assetId);
            selectedAssets.removeAsset(assetId);
          }
        }

        DataService.buildDashboard();
      };

      if (State.context === 'map' && scope.asset) {
        scope.assetLayer = _.find(State.layers, { type: 'assetgroup' });
        scope.$watch('assetLayer.active', function (n, o) {
          if (!n && o) scope.rmAssetOrGeometry()
        });
      }
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
