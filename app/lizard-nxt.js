'use strict';

/**
 * Setup app module "lizard-nxt" and do configuration for url, raven/sentry
 * angular-loading-bar.
 */


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
  'pascalprecht.translate',
  'lizard-bootstrap',
  'ui-utils',
  'export',
  'legend'
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

// The internet says it is better to set debugInfoEnabled to false in production
// but in dev it is still handy to have it set to true when compiling. No access
// to anything from the server yet, so checking window.location.
.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(window.location.host === 'localhost:9000');
}])

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
]);
