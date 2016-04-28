'use strict';
/**
 * Removes all but last asset. If no assets, it removes all but last
 * geometry, else all geometries. Result, one selected element.
 */
angular.module('data-menu')
.service("rmAllButLastAssetAndGeometry", ['State',
function (State) {

  return function () {
    State.selected.assets.forEach(function (asset) {
      if (State.selected.assets.length > 1) {
        State.selected.assets.removeAsset(asset);
      }
    });
    if (State.selected.assets.length === 0) {
      State.selected.geometries.forEach(function (geom) {
        if (State.selected.geometries.length > 1) {
          State.selected.geometries.removeGeometry(geom);
        }
      });
    }
    else {
      State.selected.geometries = [];
    }
  };

}]);
