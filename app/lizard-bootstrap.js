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
      var isInitialLoad = !urlData || !urlData.context;
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
            FavouritesService.applyFavourite(bootstrap, true);
            State.applyUrlToState(urlData);
          }
        },
        showErrorModal
      );
    };

    console.log("url123 how often does this run?");

    var urlDataForState = UrlService.getDataForState();

    console.log("url1234 1", urlDataForState);

    /**
     * Is undefined or a string containing the uuid of a favourite.
     *
     * @type {string || undefined}
     */
    var urlFavourite = UrlService.getFavourite();
    console.log("url1234 2", urlFavourite);

    if (urlFavourite) {
      var gotFavourite = function (favourite, getResponseHeaders) {
        getBootstrap(false, null);
        FavouritesService.applyFavourite(favourite);
      };
      console.log("url1234 3", urlFavourite);

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
      console.log("url1234 4", urlFavourite);
      // We are not bootstrapping on the basis of an explicit favourite. Instead
      // bootstrap a portal with overwrites from the url.
      getBootstrap(true, urlDataForState);
    }
  }
]);
