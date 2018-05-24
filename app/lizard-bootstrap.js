/**
 * Module to bootstrap the application on the basis of the server's
 * bootstrap/lizard and the state as defined on the url.
 *
 * The state in a favourite takes precedence over the url, which takes
 * precedence over the portal's bootstrap, which takes precedence over the
 * defaults in state-service. Therefore they are applied in opposite order.
 *
 * Favourite > Url > Portal > Lizard-client defaults.
 */
angular.module('lizard-bootstrap', ['favourites'])
.run([
    '$http', 'UrlService', 'State', 'FavouritesService', 'user', 'version', 'debug',
    'UserAgentService',
    function ($http, UrlService, State, FavouritesService, user, version, debug,
	     UserAgentService) {

    var showErrorModal = function () {
      var overlay = document.getElementById('dark-overlay');
      overlay.style.display = 'inline';
      throw new Error(
        'No lizard/bootstrap.json lizard is down or malfunctioning'
      );
    };

    /**
     * Gets and applies /bootstrap/lizard.
     *
     * @param  {boolean} applyState if true applies bootstrap.state, otherwise
     * only set username and backend version.
     */
    var getBootstrap = function (mustApplyState, urlData) {
      var isInitialLoad = !urlData.context;
      $http.get('bootstrap/lizard/', {})
      .then(
        function (response) {
          var bootstrap = response.data;
          // Set injected angular values: user and version.
          _.merge(user, bootstrap.user);
          version.full = bootstrap.version;
          version.revision = bootstrap.revision;
          if (mustApplyState) {
            if (!isInitialLoad) {
              var bsLayerKey;
              bootstrap.state.layers.forEach(function (bsLayer) {
                bsLayerKey = bsLayer.type + '$' + bsLayer.uuid;
                bsLayer.active = urlData.activeLayers.indexOf(bsLayerKey) > -1;
              });
            }
            FavouritesService.applyFavourite(bootstrap);
            State.applyUrlToState(urlData);
          }
        },
        showErrorModal
      );
    };

    var urlDataForState = UrlService.getDataForState();

    /**
     * Is undefined or a string containing the uuid of a favourite.
     *
     * @type {string || undefined}
     */
    var urlFavourite = UrlService.getFavourite();

    if (urlFavourite) {
      var gotFavourite = function (favourite, getResponseHeaders) {
        getBootstrap(false, null);
        FavouritesService.applyFavourite(favourite);
      };

      /**
       * Favourite might be removed or user's session expired/logged out. Either
       * way, no favourite, so look at the url again and apply portal's
       * bootstrap and then url.
       *
       * @return {[type]} [description]
       */
      var failedToGetFavourite = function () {
        getBootstrap(true, urlDataForState);
      };

      FavouritesService.getFavourite(
        urlFavourite,
        gotFavourite,
        failedToGetFavourite
      );
    }
    else {
      // We are not bootstrapping on the basis of an explicit favourite. Instead
      // bootstrap a portal with overwrites from the url.
      getBootstrap(true, urlDataForState);
    }
  }
]);
