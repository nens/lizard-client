/**
 * Service to handle timeseries retrieval.
 */
angular.module('data-menu')
  .service("AssetService", ['ChartCompositionService', 'State', '$q', '$http', 'notie', 'gettextCatalog',
    function (ChartCompositionService, State, $q, $http, notie, gettextCatalog) {
      var service = this;

      this.NESTED_ASSET_PREFIXES = ['pump', 'filter', 'monitoring_well'];

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

        .then(
          function (response) {
            response.data.entity_name = entity;
            return response.data;
          }
          ,
          function (error) {
            setTimeout(function () {
              notie.alert(
                3,
                gettextCatalog.getString(
                  "Could not fetch asset data. You may not have sufficient permissions."
                )
              );
            }, 2000);
            console.error("Error while restoring state based on favorite:", error);

            State.assets.removeAsset(entity + "$" + id);
          }
        );
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
          var assetId = service.getAssetKey(asset);
          var parentId = asset.parentAsset;
          return (selectedAssets.indexOf(assetId) !== -1 ||
                  (parentId && selectedAssets.indexOf(parentId) !== -1));
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

      this.isNestedAsset = function (entityName) {
        if (entityName.indexOf('$') !== -1) {
          entityName = entityName.split('$')[0];
        }

        return service.NESTED_ASSET_PREFIXES.indexOf(entityName) !== -1;
      };

      this.getAssetKey = function(asset) {
        return asset.entity_name + '$' + asset.id;
      };
  }
]);
