

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
.service('getNestedAssets', ["AssetService", function (AssetService) {
    return function (asset) {

      var pluralizer = function (str) { return str + "s"; } ;
      var NESTED_ASSETS = _.map(AssetService.NESTED_ASSET_PREFIXES, pluralizer);
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

      nestedAssets.forEach(function (nestedAsset) {
        nestedAsset.name = asset.name;
        nestedAsset.entity_name = attr; // Store to remove asset from selection.
      });

      // console.log("[dbg] First of the nested assets retuned by getNestedAssets:", nestedAssets[0]);

      return nestedAssets;

    };

  }
]);
