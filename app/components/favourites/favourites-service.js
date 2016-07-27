/**
 * Service to handle favourites retrieval, creation and deletion.
 */
angular.module('favourites')
  // NOTE: inject TimeseriesService even though it is not used.
  // TimeseriesService defines State.selected.timeseries which may be restored
  // from favourite.
  .service("FavouritesService", ['$resource', 'State', 'gettextCatalog', 'UtilService', 'notie', '$window', 'TimeseriesService',
    function ($resource, State, gettextCatalog, UtilService, notie, $window) {

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


      /**
       * Sets $window.location to login url. Reroutes to favourite url if called
       * on an object with a favourite. Uses $window for testing purposes.
       */
      this.logIn = function () {

        var domain = $window.location.protocol +
          '//' +
          $window.location.host.replace(':9000', ':8000') ;

        var loginUrl = [
          '/accounts/login/?domain=' + domain,
          '&next=' + $window.location.protocol + '//' + $window.location.host,
        ];

        if (this.favourite) {
          loginUrl.push('favourites', this.favourite);
        }

        $window.location = loginUrl.join('/');
      };

      this.getFavourite = function(uuid, success, error) {
        // Bind login function tot uuid here, otherwise it is done
        // asynchronously to the last requested favourite.
        var confirmCb = this.logIn.bind({favourite: uuid});

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
          if (err.status === 404) { // Removed.
            notie.alert(
              3,
              gettextCatalog.getString('Whoops: favourite has been removed'),
              3
            );
            error();
          }
          else if (err.status === 401) { // Not authenticated.
            notie.confirm(
              gettextCatalog.getString('You need to be logged in for this favourite, do you want to log in now?'),
              gettextCatalog.getString('Yes'),
              gettextCatalog.getString('Never mind'),
              confirmCb,
              error()
            );
          }
          else {
            notie.alert( // Something else.
              3,
              gettextCatalog.getString(
                'Ay ay: Lizard could not retrieve your favourite'
              ),
              3
            );
            error();
          }
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
        favtime.now = null; // Set when creating favourite
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

        // Use _.mergeWith to set the whole array to trigger setters of
        // properties.
        var collections = ['active', 'timeseries', 'assets', 'geometries'];
        _.mergeWith(State, state, function (_state, favstate, key, parent) {
          if (collections.indexOf(key) !== -1) {
            _state = favstate;
            return _state;
          }
        });

        UtilService.announceMovedTimeline(State);

      };

      return this;
    }
  ]);
