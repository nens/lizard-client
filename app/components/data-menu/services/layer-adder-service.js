/**
 * Service to handle layer-group retrieval.
 */
angular.module('data-menu')
  .service("LayerAdderService", ['$resource', function ($resource) {

      /* Provide a resource for interacting with the layergroups endpoint of
       * the API.
       *
       * Use a reconfigured 'query' so it actually returns an array of items.
       */
      var layerGroups = $resource('/api/v2/layergroups/:slug/', {}, {
        'query': {
          method:'GET',
          isArray:false
        }
      });

      /**
       * Get layergroups from the API.
       * @param {dict} params - A dictionary of request params (e.g.
       *                        {'page_size': 10}).
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchLayerGroups = function (params, success, error) {
        layerGroups.query(params, success, error);
      };

      /**
       * Get single layergroup from the API.
       * @param {string} params - slug for layergroup you are looking for.
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchLayerGroup = function (slug, success, error) {
        layerGroups.get({slug: slug}, success, error);
      };

      return this;
    }
  ]);
