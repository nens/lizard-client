

/**
 * Service to parse and get a list of assets from parent assets.
 *
 * It return the pumps, filters and monitoringwells as a list of assets.
 *
 * Usage: inject getNestedAssets and call getNestedAssets(parentAsset);
 *
 * @param {object} asset Parent asset.
 * @return {array} list of child assets with entity names.
 */
angular.module('omnibox')
.service('getNestedAssets', [
  function () {
    return function (asset) {

      var NESTED_ASSETS = ['pumps', 'filters', 'monitoring_wells'];
      var nestedAssets = [];

      var child = _.pickBy(asset, function (value, key) {
        return NESTED_ASSETS.indexOf(key) !== -1;
      });

      if (_.isEmpty(child)) {
        return [];
      }

      var name = Object.keys(child)[0];
      var value = child[name];

      // entity_name is singular, property name is plural. Use slice to remove
      // last 's'. Do not worry, I am an engineer.
      var attr = name.slice(0,-1).replace('_', '');

      if (typeof(value) === 'string') {
        nestedAssets = JSON.parse(value);
      } else if (typeof(value) === 'object') {
        nestedAssets = value;
      } else {
        nestedAssets = [];
      }

      nestedAssets.forEach(function (asset) {
        asset.entity_name = attr; // Store to remove asset from selection.
      });

      return nestedAssets;

    };

  }
]);
