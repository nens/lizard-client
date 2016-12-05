/**
 * Service to handle timeseries retrieval.
 */
angular.module('data-menu')
  .service("AssetService", ['State', '$q', '$http',
    function (State, $q, $http) {

      // TODO: Why asset service here in the data-menu (which is a subset: not
      // a data menu but a data layer menu)? You do assetthings in the
      // data-service and you do it here. The data-service is an interface?
      // In that case, the data-service should be stripped to a be a bare
      // interface. Move the geometries to their own place.
      // There might be some sync vs async magic going on here that I just
      // don't get. Even then, to me it doesn't speak for itself.

      this.NESTED_ASSET_PREFIXES = ['pump', 'filter', 'monitoring_well'];

      // TODO: so I understand why this was put in asset-service. Still this
      // seems to be a method that affects timeseries. So shouldn't this be a
      // part of the timeseries service? Off course that could lead to circular
      // reference problems directly or just eventually.
      /**
       * Removes all the ts from the selection of the asset. It should not be
       * possible to select ts of assets.
       *
       * @param  {object} asset
       */
      var removeTSofAsset = function (asset) {
        State.selections = _.differenceBy(
          State.selections,
          asset.timeseries,
          'uuid'
        );
      };

      /**
       * @param {string} entity - name of the entity
       * @param {string} id -  id of the enitity
       * returns {object} promise - thenable with result of the asset API
       */
      var getAsset = function (entity, id) {
        return $http({
          url: 'api/v2/' + entity + 's' + '/' + id + '/',
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
            removeTSofAsset(asset);
          }
          return keep;
        });
      };

      /**
       * Updates assets by making requests to asset api.
       *
       * @param  {array}  assets       array of assets as from api
       * @param  {array}  oldSelection old array of assetId of selected assets
       * @param  {array}  newSelection new array of assetId of selected assets
       */
      /**
       * anonymous function - description
       *
       * @param  {type} assets       description
       * @param  {type} oldSelection description
       * @param  {type} newSelection description
       * @return {type}              description
       */

      this.updateAssets = function (assets, oldSelection, newSelection) {

        var newAssets = newSelection.filter(function (assetId) {
          return oldSelection.indexOf(assetId) === -1;
        });

        if (newAssets) {
          return _.map(newAssets, function (asset) {
            var entity = asset.split('$')[0];
            var id = asset.split('$')[1];

            return getAsset(entity, id);
          });
        }

        else {
          var defer = $q.defer();
          defer.resolve();
          return [defer.promise];
        }
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
