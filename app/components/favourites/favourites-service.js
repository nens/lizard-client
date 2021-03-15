/**
 * Service to handle favourites retrieval, creation and deletion.
 */
angular.module('favourites')
  .service("FavouritesService", [
    '$resource',
    'State',
    'gettextCatalog',
    'UtilService',
    'notie',
    '$window',
    '$timeout',
    'DashboardChartService',
    'ChartCompositionService',
    function (
        $resource,
        State,
        gettextCatalog,
        UtilService,
        notie,
        $window,
        $timeout,
        DashboardChartService,
        ChartCompositionService)
    {
      var _appliedFavourite = null;
      this.getAppliedFavourite = function () { return _appliedFavourite; };

      this.favsContainerEnabled = { value: false };

      this.showFavsContainer = function  () {
        var favsContainer = document.querySelector("#lizard-favs-container");
        if (!this.favsContainerEnabled.value) {
          this.favsContainerEnabled.value = true;
          if (favsContainer.classList.contains('hidden'))
            favsContainer.classList.remove('hidden');
        }
        else
          console.error("[E] Tried to *show* fav container via svc, but svc state is inconsistent!");
      };

      this.hideFavsContainer = function  () {
        var favsContainer = document.querySelector("#lizard-favs-container");
        if (this.favsContainerEnabled.value) {
          this.favsContainerEnabled.value = false;
          if (!favsContainer.classList.contains('hidden')) {
            // OK
            favsContainer.classList.add('hidden');
          } else {
            // Inconsistency detected!
            console.error("[E] Tried to *hide* favsContainer but classList already contains 'hidden'!");
          }
        }
        else
          console.error("[E] Tried to *hide* fav container via svc, but svc state is inconsistent!");
      };

      /* Create a resource for interacting with the favourites endpoint of the
       * API.
       *
       * Use a reconfigured 'query' so it actually returns an array of items.
       */
      var Favourites = $resource('/api/v3/favourites/:uuid/', {uuid:'@uuid'}, {
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

      var areExpectedLayersPresent = function (response) {
        var expectedLayerKeys = response.state.layerKeys;
        if (expectedLayerKeys !== undefined) {
          var receivedLayerKeys = _.map(response.state.layers, function (layer) {
            return layer.type + "$" + layer.uuid;
          });
          return _.every(expectedLayerKeys, function (layerKey) {
            return receivedLayerKeys.indexOf(layerKey) > -1;
          });
        } else {
          return true;
        }
      };

      this.getFavourite = function(uuid, success, error) {
        // Bind login function tot uuid here, otherwise it is done
        // asynchronously to the last requested favourite.
        var confirmCb = this.logIn.bind({favourite: uuid});

        return Favourites.get(
          {'uuid': uuid},
          function (response) {
            // Check whether all expected layers are actually present in the
            // favourite (this is not the case when the fav contains layers
            // the current user isn't authorized to see):
            if (areExpectedLayersPresent(response)) {
              notie.alert(
                4,
                gettextCatalog.getString('OK, restoring favourite ') + response.name,
                3
              );
            } else {
              notie.alert(
                3,
                gettextCatalog.getString(
                  "Warning: the favourite has layers that you're not authorized to see"),
                3
              );
            }
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
            } else if (err.status === 401) { // Not authenticated.
              notie.confirm(
                gettextCatalog.getString('You need to be logged in for this' +
                  ' favourite, do you want to log in now?'
                ),
                gettextCatalog.getString('Yes'),
                gettextCatalog.getString('Never mind'),
                confirmCb,
                error()
              );
            } else {
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
          'state': createJson(state)
        };
        return Favourites.save(data, success, error);
      };

      var createJson = function (state) {
        // Favourite consists of the State-service, plus extras from other
        // services (currently the dashboard charts).

        var data = _.clone(state);
        data.chartComposition = {
          dashboardCharts: ChartCompositionService.dashboardCharts,
          composedCharts: ChartCompositionService.composedCharts
        };
        data.layerKeys = _.map(state.layers, function (layer) {
          return layer.type + "$" + layer.uuid;
        });

        return JSON.stringify(data);
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
       * Merges State and favourite.state.
       *
       * It loops over ATTRIBUTES and replaces State[ATTRIBUTE] with
       * favourite.state[ATTRIBUTE] if defined in favourite.state.
       * Two exceptions:
       *
       * 1. State.temporal can be restored relative to Date.now().
       *
       * 2. State.layers is defined in State-service as an array
       * with a computed property *active* which will be lost if replaced. So
       * the array is emptied and filled with favourite.state.layers if
       * favourite.state.layers is defined as an array.
       *
       * @param {object} favourite - The favourite to apply with a state.
       */
      this.applyFavourite = function (favourite, isApplyingBootstrap) {
        if (!isApplyingBootstrap) {
          _appliedFavourite = JSON.parse(JSON.stringify(favourite));
        }
        // Restore assets
        if (typeof favourite.state.assets !== 'undefined') {
          favourite.state.assets.forEach(function (asset) {
            State.assets.addAsset(asset);
          });
        }

        // Restore layers
        if (typeof favourite.state.layers !== 'undefined') {
          favourite.state.layers.forEach(function (layer) {
            if (! _.find(State.layers, {uuid: layer.uuid})) {
              State.layers.push(layer);
            }
          });
        }

        // Restore geometries
        if (typeof favourite.state.geometries !== 'undefined') {
          favourite.state.geometries.forEach(function (geometry) {
            State.geometries.addGeometry(geometry);
          });
        }

        // Reset dashboard charts
        if ((favourite.state.VERSION || 0) < 2 &&
            favourite.state.selections && favourite.state.selections.length) {
          // XXXV1. Won't be needed anymore when these are gone from the database.
          favourite.state.chartComposition = DashboardChartService.translateSelections(
            favourite.state.selections);
        }
        if (favourite.state.chartComposition) {
          var composition = favourite.state.chartComposition;
          ChartCompositionService.dashboardCharts = composition.dashboardCharts;
          ChartCompositionService.composedCharts = composition.composedCharts;
        }

        if (favourite.state.spatial && !_.isUndefined(favourite.state.spatial.bounds)) {
          // timeout to solve on startup mapextend bug:
          // https://github.com/nens/lizard-client/issues/1154
          $timeout(function () {
            State.spatial.bounds = favourite.state.spatial.bounds;
            State.spatial.bounds.isValid = function () { return true; };
          });
        }

        if (favourite.state.temporal && favourite.state.temporal.relative) {
          favourite.state.temporal = adhereTemporalStateToInterval(
            favourite.state.temporal
          );
        }

        // Specific attributes
        var ATTRIBUTES = [
          'box.type',
          'language',
          'baselayer',
          'annotations.active',
          'annotations.present',
          'spatial.view',
          'layers.active',
          'context'
        ];

        if (!isApplyingBootstrap) {
          ATTRIBUTES = ATTRIBUTES.concat(
            ['temporal.start', 'temporal.end', 'temporal.at', 'temporal.playing']
          );
        }

        ATTRIBUTES.forEach(function (key) {
          var favState = _.get(favourite.state, key);

          if (!_.isUndefined(favState)) {

              _.set(State, key, favState);
          }
        });

        UtilService.announceMovedTimeline(State);
      };

      return this;
    }
  ]);
