/**
 * Service to handle timeseries retrieval.
 */
angular.module('data-menu')
  .service("AssetService", ['State', '$q', '$http',
    function (State, $q, $http) {

      this.NESTED_ASSET_PREFIXES = ['pump', 'filter', 'monitoring_well'];

      /**
       * Removes all the selections of the asset. It should not be
       * possible to select timeseries or asset selections that belong to this
       * asset.
       *
       * @param  {object} asset
       */
      var removeAssetSelections = function (asset) {
        State.selections = _.differenceWith(
          State.selections,
          asset.timeseries,
          function(selectionTs, assetTs) {
            return selectionTs.timeseries === assetTs.uuid;}
        );
        State.selections = _.filter(State.selections, function(selection) {
            return selection.asset !== asset.entity_name + "$" + asset.id;
        });
      };

      /**
       * @param {string} entity - name of the entity
       * @param {string} id -  id of the enitity
       * returns {object} promise - thenable with result of the asset API
       */
      this.getAsset = function (entity, id) {
        return $http({
          url: 'api/v3/' + entity + 's' + '/' + id + '/',
          method: 'GET'
        })

        .then(function (response) {
          response.data.entity_name = entity;
          return response.data;
        });
      };

      /**
       * Removes assets from service when not selected.
       *
       * @param  {array}  selectedAssets State.asssets.
       * @param  {array}  currentAssets  DataService.assets
       * @return {array}                 Updated DataService.assets.
       */
      this.removeOldAssets = function (selectedAssets, currentAssets) {
        return currentAssets.filter(function (asset) {
          var assetId = asset.entity_name + '$' + asset.id;
          var keep = selectedAssets.indexOf(assetId) !== -1;
          if (!keep) {
            removeAssetSelections(asset);
          }
          return keep;
        });
      };

      /**
       * Given State.assets, get the names for the assets that are
       * nested within other assets (e.g. 'filter$23').
       *
       * @return {array} Names of currently selected assets that are nested.
       */
      this.getAllNestedAssetNames = function () {
        var nestedAssetPrefixes = this.NESTED_ASSET_PREFIXES,
            nestedAssetNames = [];
        State.assets.forEach(function (assetName) {
          nestedAssetPrefixes.forEach(function (nestedAssetPrefix) {
            if (assetName.startsWith(nestedAssetPrefix)) {
              nestedAssetNames.push(assetName);
            }
          });
        });
        return nestedAssetNames;
      };

      /**
       * Given State.assets, get the names for the assets that are not
       * nested within other assets (e.g. 'pumpstation$303').
       *
       * @return {array} Names of currently selected assets that aren't nested.
       */
      this.getAllNonNestedAssetNames = function () {
        return _.difference(State.assets,
          this.getAllNestedAssetNames());
      };
  }
]);
