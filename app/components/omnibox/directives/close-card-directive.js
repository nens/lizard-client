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
angular.module("omnibox").directive("closeCard", [
  "State",
  "DataService",
  "getNestedAssets",
  "TimeseriesService",
  "ClickFeedbackService",
  function(
    State,
    DataService,
    getNestedAssets,
    TimeseriesService,
    ClickFeedbackService
  ) {
    var link = function(scope, element, attrs) {
      /**
       * Removes asset from global State.
       *
       * Requires entity and id of asset on scope.
       */
      scope.rmAssetOrGeometry = function() {
        if (scope.geometry) {
          State.geometries.removeGeometry(scope.geometry);
          // TODO: update composedCharts!
        } else if (scope.asset) {
          var assetId = scope.asset.entity_name + "$" + scope.asset.id;

          // Remove the nested assets (for local scope.asset)
          getNestedAssets(scope.asset).forEach(function(asset) {
            var assetId = asset.entity_name + "$" + asset.id;
            var i = State.assets.indexOf(assetId);
            if (i !== -1) {
              State.assets.removeAsset(assetId);
            }
          });

          // Remove the asset itself (for local scope.asset)
          var selectedAssets = State.assets;

          if (selectedAssets.length > 1) {
            ClickFeedbackService.labelsLayer.clearLayers();
          }
          if (selectedAssets.indexOf(assetId) >= 0) {
            if (State.box.type !== "point") {
              for (var layer in ClickFeedbackService.labelsLayer._layers) {
                if (
                  ClickFeedbackService.labelsLayer._layers[layer].feature.id ===
                  scope.asset.id
                ) {
                  ClickFeedbackService.labelsLayer.removeLayer(
                    ClickFeedbackService.labelsLayer._layers[layer]
                  );
                }
              }
            } else {
              ClickFeedbackService.labelsLayer._layers.clearLayers();
            }
            selectedAssets.removeAsset(assetId);
          }
        }
      };
    };

    return {
      link: link,
      restrict: "E",
      scope: {
        asset: "=",
        geometry: "="
      },
      replace: true,
      templateUrl: "omnibox/templates/close-card.html"
    };
  }
]);
