/**
 * Service to handle layer-group retrieval.
 */
angular.module('data-menu')
  .service("LayerAdderService", ['$http', 'State', function ($http, State) {

      /**
       * Get layergroups from the API.
       * @param {dict} params - A dictionary of request params (e.g.
       *                        {'page_size': 10}).
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchLayers = function (params, success, error) {
        // layers.query(params, success, error);
      };

      /**
       * Get single layergroup from the API.
       * @param {string} params - slug for layergroup you are looking for.
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchLayer = function (entity, id) {
        return $http({
          url: 'api/v2/' + entity + '/' + id + '/',
          method: 'GET'
        })

        .then(function (response) {
          return response.data;
        });
      };

      this.remove = function (layer) {
        console.log('remove', layer);
        _.remove(State.layers, {uuid: layer.uuid});
        console.log(State);
      };

      return this;
    }
  ]);
