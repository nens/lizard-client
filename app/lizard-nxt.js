'use strict';

/**
 * Setup Raven if available.
 * Raven is responsible for logging to https://sentry.lizard.net
 */
if (window.RavenEnvironment) {
  window.Raven.config(window.RavenEnvironment,
  {
    // limits logging to staging and prd
    whitelistUrls: [/integration\.nxt\.lizard\.net/,
                    /nxt\.lizard\.net/,
                    /staging\.nxt\.lizard\.net/]
  }).install();
}

/**
 * Initialise angular.module('lizard-nxt')
 *
 */
angular.module("lizard-nxt", [
  'lizard-nxt-filters',
  'data-menu',
  'map',
  'omnibox',
  'restangular',
  'dashboard',
  'time-ctx',
  'scenarios',
  'user-menu',
  'global-state',
  'ngSanitize',
  'ngCsv'
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
});

/**
 * Change default angular tags to prevent collision with Django tags.
 */
angular.module('lizard-nxt')
  .config(function ($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
});

/**
 * Set url fragment behavior to HTML5 mode (without hash in url).
 */
angular.module('lizard-nxt')
  .config(function ($locationProvider) {
  // We want to release to gh-pages for demo purposes or whatever
  // But github.io doesn't rewrite the urls beautifully like we do.
  var html5Mode = (window.location.host !== 'nens.github.io' &&
                   window.location.host !== 'lizard.sandbox.lizard.net');
  $locationProvider.html5Mode(html5Mode);
});

/**
 * @name user
 * @memberOf app
 * @description User and auth stuff
 */
angular.module('lizard-nxt')
  .constant('user', window.user);

/**
 * @name versioning
 * @memberOf app
 * @description User and auth stuff
 */
angular.module('lizard-nxt')
  .constant('versioning', window.versioning);

/**
 * @name production backend
 * @memberOf app
 * @description subdomain of production backend.
 */
angular.module('lizard-nxt')
  .constant('backendDomain', 'https://demo.lizard.net');
