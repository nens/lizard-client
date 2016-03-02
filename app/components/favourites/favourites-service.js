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

      this.getFavourite = function(uuid, success) {
        return Favourites.get({'uuid': uuid}, success);
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

        // NOTE: do not move favourites or the master-controller relative to each
        // other in the scope tree. Context is a primitive which cannot just be
        // merged like the rest of the state.
        scope.$parent.$parent.transitionToContext(favourite.state.context);

        _.merge(State, favourite.state);

        // _.merge pushes objects in the list, does not call setAssets
        // so first make it empty then stuff everything in there.
        State.selected.assets.resetAssets(favourite.state.selected.assets);
        // State.selected.assets = favourite.state.selected.assets;
        State.temporal.timelineMoving = !favourite.state.temporal.timelineMoving; // update timeline
      };

      return this;
    }
  ]);
