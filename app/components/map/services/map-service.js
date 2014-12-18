'use strict';

/**
 * @ngdoc service
 * @class MapService
 * @memberof app
 * @name MapService
 * @requires NxtMap
 * @summary stores global NxtMap instance of the app.
 */

angular.module('lizard-nxt')
  .factory('MapService', ['NxtMap',
    function (NxtMap) {
      return new NxtMap();
    }
]);
