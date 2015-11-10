'use strict';

/**
 * @ngdoc service
 * @name Underscore
 * @description
 * # Wrapper for underscore
 * Discloses underscore as service for dependency injection.
 */
angular.module('lodash', [])
  .service('Lodash', function () {
    return window._; 
  });

