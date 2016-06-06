'use strict';

/**
 * Setup Raven if available.
 * Raven is responsible for logging to https://sentry.lizard.net
 */
if (window.RavenEnvironment) {
  window.Raven.config(window.RavenEnvironment, {
    ignoreUrls: [/localhost/]
  }).install();
  if (window.user.authenticated) {
    window.Raven.setUserContext({
      username: window.user.userName
    });
  }
}

/**
 * Configure Angular's $resource to not strip trailing slashes.
 */
angular.module('ngResource').config([
  '$resourceProvider', function($resourceProvider) {
    $resourceProvider.defaults.stripTrailingSlashes = false;
  }
]);

/**
 * Initialise angular.module('lizard-nxt')
 *
 */
angular.module("lizard-nxt", [
  'lizard-nxt-filters',
  'ngAnimate',
  'annotations',
  'data-menu',
  'map',
  'omnibox',
  'dashboard',
  'scenarios',
  'user-menu',
  'favourites',
  'global-state',
  'ngSanitize',
  'ngCsv',
  'gettext',
  'timeseries',
  'lodash',
  'ui.bootstrap',
  'lizard-http-throttler', // Add this $http interceptor befor the loading-bar.
  'angular-loading-bar',
  'lizard-boostrap'
])

// Decorator for ngExceptionHandler to log exceptions to sentry
.config(function ($provide) {
  $provide.decorator("$exceptionHandler", function ($delegate) {
    return function (exception, cause) {
      $delegate(exception, cause);
      window.Raven.captureException(exception, {
        extra: {cause: cause}
      });
    };
  });
})

.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
}])

/**
 * Change default angular tags to prevent collision with Django tags.
 */
.config(function ($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
})

/**
 * Set url fragment behavior to HTML5 mode (without hash in url).
 */
.config(function ($locationProvider) {
  // We want to release to gh-pages for demo purposes or whatever
  // But github.io doesn't rewrite the urls beautifully like we do.
  var html5Mode = (window.location.host !== 'nens.github.io' &&
                   window.location.host !== 'lizard.sandbox.lizard.net');
  $locationProvider.html5Mode(html5Mode);
})

// Configure loading indicator.
.config(['cfpLoadingBarProvider', function (cfpLoadingBarProvider) {
  // Only show bar, no spinner.
  cfpLoadingBarProvider.includeSpinner = false;
  // Default is 100, but Lizard is not for impatient teenagers, so 250 is ok.
  cfpLoadingBarProvider.latencyThreshold = 250;
  }
])

/**
 * @name notie
 * @memberOf app
 * @description Notification service
 */
.constant('notie', window.notie)

/**
 * @name production backend
 * @memberOf app
 * @description subdomain of production backend.
 */
.constant('backendDomain', 'https://demo.lizard.net');

angular.module('lizard-boostrap', ['favourites'])
.run([
  '$http', 'UrlService', 'FavouritesService', 'user', 'version', 'debug',
  function ($http, UrlService, FavouritesService, user, version, debug) {

    var urlState = UrlService.getState();

    var getBootstrap = function (applyState) {
      $http.get('api/v2/bootstrap', {})
      .then(
        function (response) {
          var bootstrap = response.data;
          _.merge(user, bootstrap.user);
          _.merge(version, bootstrap.version);
          if (applyState) {
            FavouritesService.applyFavourite(bootstrap.state);
            console.log(urlState);
            FavouritesService.applyFavourite(urlState);
          }
        },
        function (response) {
          // Show user facing error message
        }
      );
    };

    var urlFavourite = UrlService.getFavourite();

    if (urlFavourite) {
      FavouritesService.getFavourite(
        urlFavourite,
        function (favourite, getResponseHeaders) {
          getBootstrap(false);
          FavouritesService.applyFavourite(favourite);
        },
        function () {
          // Show error facing message
          getBootstrap(true);
        }
      );
    }
    else {
      getBootstrap(true);
    }

  }
]);
