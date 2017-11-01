/**
 * Service to handle timeseries retrieval.
 */
angular.module('data-menu')
  .service("AssetService", ['ChartCompositionService', 'State', '$q', '$http',
    function (ChartCompositionService, State, $q, $http) {

      this.NESTED_ASSET_PREFIXES = ['pump', 'filter', 'monitoring_well'];

      var removeAssetSelections = function (asset) {
        var keepSelections = [];

        for (var i = 0; i < State.selections.length; i++) {
          var selection = State.selections[i];

          var timeseriesInAsset = (asset.timeseries || []).map(
            function (ts) { return ts.uuid; }
          ).indexOf(selection.timeseries) !== -1;

          if (timeseriesInAsset || selection.asset === asset.entity_name + "$" + asset.id) {
            // Remove
            if (State.context === 'dashboard') {
              ChartCompositionService.removeSelection(selection.uuid);
            }
          } else {
            // Keep
            keepSelections.push(selection);
          }
        }
        State.selections = keepSelections;
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

      this.isNestedAsset = function (entityName) {
        return this.NESTED_ASSET_PREFIXES.indexOf(entityName) !== -1;
      }
  }
]);
