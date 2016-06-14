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
        // Physical now
        var now = Date.now();
        // Difference between now and the now back when the fav was made.
        var change = now - favtime.now;

        favtime.start += change;
        favtime.at  += change;
        favtime.end += change;
        favtime.now = null;
        favtime.relative = false; // Set relative back to default.
        return favtime;
      };

      /**
       * Replace the current portal state with the favourite state.
       * @param {object} favourite - The favourite to apply.
       */
      this.applyFavourite = function (state) {

        if (state.temporal && state.temporal.relative) {
          state.temporal = adhereTemporalStateToInterval(
            state.temporal
          );
        }

        var baselayers = angular.copy(_.filter(State.layers, {'type': 'baselayer'}));_

        // Use _.mergeWith to set the whole array to trigger functions of
        // properties.
        var arrayStates = ['layers', 'timeseries', 'assets', 'geometries'];
        _.mergeWith(State, state, function (_state, favstate, key, parent) {
          if (arrayStates.indexOf(key) !== -1) {
            _state = favstate;
          }
        });

        _.forEach(baselayers, function (baselayer) {
          if (!_.find(State.layers, {type: 'baselayer', uuid: baselayer.uuid})) {
            State.layers.push(baselayer);
          }
        });


        UtilService.announceMovedTimeline(State);

      };

      return this;
    }
  ]);
