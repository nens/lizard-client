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
      var layerGroups = $resource('/api/v2/layergroups/:id/', {}, {
        'query': {
          method:'GET',
          isArray:true,
          transformResponse:
            function (data, headers) {
              var angularData = angular.fromJson(data);
              if ('results' in angularData) {
                return angularData.results;
              } else {
                return angularData;
              };
            }
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
      }

      return this;
    }
  ]);
