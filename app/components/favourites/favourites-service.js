/**
 * Service to handle favourites retrieval, creation and deletion.
 */
angular.module('favourites')
  // NOTE: inject TimeseriesService even though it is not used.
  // TimeseriesService defines State.selected.timeseries which may be restored
  // from favourite.
  .service("FavouritesService", ['$resource', 'State', 'gettextCatalog', 'UtilService', 'notie', 'TimeseriesService',
    function ($resource, State, gettextCatalog, UtilService, notie) {

      /* Create a resource for interacting with the favourites endpoint of the
       * API.
       *
       * Use a reconfigured 'query' so it actually returns an array of items.
       */
      var Favourites = $resource('/api/v2/favourites/:uuid/', {uuid:'@uuid'}, {
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
              }
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

      this.getFavourite = function(uuid, success, error) {
        return Favourites.get(
          {'uuid': uuid},
          function (response) {
            notie.alert(
              4,
              gettextCatalog.getString('Restoring favourite ') +
              response.name,
              3
            );
            success(response);
          },
          function (err) {
          if (err.status === 404) {
            notie.alert(
              3,
              gettextCatalog.getString('Whoops: favourite has been removed'),
              3
            );
          }
          else {
            notie.alert(
              3,
              gettextCatalog.getString(
                'Ay ay: Lizard could not retrieve your favourite'
              ),
              3
            );
          }
          error();
        });
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
        return Favourites.delete({uuid: favourite.uuid}, success, error);
      };

      /**
       * @function
       * @description calculate the interval from the fav State
       * to the new state if the interval should be relative
       */
      var adhereTemporalStateToInterval = function (favtime) {
        var now = Date.now();

        var temporal = angular.copy(favtime); // otherwise all changes are applied to the
                                        // retrieved temporal state.

        temporal.start = now - (temporal.end - temporal.start);
        temporal.at = now - (temporal.end - temporal.at);
        if (temporal.end > temporal.now) {
          temporal.end = now - (temporal.now - temporal.end);
        } else if (temporal.end < temporal.now) {
          temporal.end = now - (temporal.end - temporal.now);
        }
      };

      /**
       * Replace the current portal state with the favourite state.
       * @param {object} favourite - The favourite to apply.
       */
      this.applyFavourite = function (favourite) {
        if (favourite.state.temporal.relative) {
          adhereTemporalStateToInterval(favourite.state.temporal);
        }

        // Use _.mergeWith to set the whole array to trigger functions of
        // properties.
        var arrayStates = ['active', 'timeseries', 'assets', 'geometries'];
        _.mergeWith(State, favourite.state, function (state, favstate, key, parent) {
          if (arrayStates.indexOf(key) !== -1) {
            state = favstate;
            return state;
          }
        });

        UtilService.announceMovedTimeline(State);

      };

      return this;
    }
  ]);
