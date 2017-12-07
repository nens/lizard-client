'use strict';
/**
 * Removes all but last asset. If no assets, it removes all but last
 * geometry, else all geometries. Result, one selected element.
 */
angular.module('data-menu')
.service("rmAllButLastAssetAndGeometry", ['State', 'DashboardChartService',
function (State, DashboardChartService) {

  return function () {
    State.assets.forEach(function (asset) {
      if (State.assets.length > 1) {
        DashboardChartService.deleteChartsForAsset(asset);
        State.assets.removeAsset(asset);
      }
    });
    State.geometries.forEach(function (geom) {
      if (State.assets.length + State.geometries.length > 1) {
        State.geometries.removeGeometry(geom);
      }
    });
  };

}]);
