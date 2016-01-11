/**
 * Service to handle timeseries retrieval.
 */
angular.module('data-menu')
  .service("AssetService", ['CabinetService', '$q', '$http',
    function (CabinetService, $q, $http) {


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
          return newSelection.indexOf(assetId) !== -1;
        });

        var newAssets = newSelection.filter(function (assetId) {
          return oldSelection.indexOf(assetId) === -1;
        });

        var promises = [];

        newAssets.forEach(function (assetId) {

          var entity = assetId.split('$')[0];
          var id = assetId.split('$')[1];

          promises.push(
            $http({
              url: 'api/v2/' + entity + 's' + '/' + id + '/',
              method: 'GET'
            })

            .then(function (response) {
              response.data.entity_name = entity;
              assets.push(response.data);
            })
          );
        });

        return $q.all(promises).then(function () { return assets; });
      };

  }

]);

