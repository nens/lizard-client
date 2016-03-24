/**
 * Service to handle timeseries retrieval.
 */
angular.module('data-menu')
  .service("AssetService", ['State', '$q', '$http',
    function (State, $q, $http) {

      /**
       * Removes all the ts from the selection of the asset. It should not be
       * possible to select ts of assets.
       *
       * @param  {object} asset
       */
      var removeTSofAsset = function (asset) {
        State.selected.timeseries = _.differenceBy(
          State.selected.timeseries,
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
       * Updates assets by making requests to asset api.
       *
       * @param  {array}  assets       array of assets as from api
       * @param  {array}  oldSelection old array of assetId of selected assets
       * @param  {array}  newSelection new array of assetId of selected assets
       */
      this.updateAssets = function (assets, oldSelection, newSelection) {

        assets = assets.filter(function (asset) {
          var assetId = asset.entity_name + '$' + asset.id;
          var keep = newSelection.indexOf(assetId) !== -1;
          if (!keep) {
            removeTSofAsset(asset);
          }
          return keep;
        });

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

  }

]);
