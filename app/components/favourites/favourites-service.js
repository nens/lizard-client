/**
 * Service to handle favourites retrieval, creation and deletion.
 */
angular.module('favourites')
  .service("FavouritesService", ['$resource', 'State',
    function ($resource, State) {

      /* Create a resource for interacting with the favourites endpoint of the
       * API.
       *
       * Use a reconfigured 'query' so it actually returns an array of items.
       */
      var Favourites = $resource('/api/v2/favourites/:id/', {}, {
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
       * Get all favourites from the API.
       * @param {dict} params - A dictionary of request params (e.g.
       *                        {'page_size': 10}).
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchAllFavourites = function (params, success, error) {
        return Favourites.query(params, success, error);
      };

      /**
       * Add a new favourite to the API.
       * @constructor
       * @param {string} name - The name of the new favourite.
       * @param {object} state - The current state of the portal.
       * @param {function} success - Execute this function on a successful
       *                             POST.
       * @param {function} error - Execute this function when something goes
       *                           wrong with the POST.
       * @returns {object} - The new favourite.
       */
      this.createFavourite = function (name, state, success, error) {
        var data = {
          'name': name,
          'state': JSON.stringify(state)
        };

        return Favourites.save(data, success, error);
      };

      /**
       * Remove a favourite from the API.
       * @param {object} favourite - The favourite to be deleted.
       * @param {function} success - Execute this function on a successful
       *                             DELETE.
       * @param {function} error - Execute this function when something goes
       *                           wrong with the DELETE.
       */
      this.deleteFavourite = function (favourite, success, error) {
        return Favourites.delete({id: favourite.id}, success, error);
      };

      return this;
    }
  ]);
