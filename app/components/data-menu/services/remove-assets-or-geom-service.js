'use strict';
/**
 * Removes all but last asset. If no assets, it removes all but last
 * geometry, else all geometries. Result, one selected element.
 */
angular.module('data-menu')
.service("rmAllButLastAssetAndGeometry", ['State',
function (State) {

  return function () {
    State.assets.forEach(function (asset) {
      if (State.assets.length > 1) {
        State.assets.removeAsset(asset);
      }
    });
    if (State.assets.length === 0) {
      State.geometries.forEach(function (geom) {
        if (State.geometries.length > 1) {
          State.geometries.removeGeometry(geom);
        }
      });
    }
    else {
      State.geometries = [];
    }
  };

}]);
