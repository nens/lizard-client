'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtDataLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
.factory('eventseriesDataLayer', ['VectorService',
  function (VectorScervice) {

    return function (options) {

      var eventseriesDataLayer = options;

      eventseriesDataLayer.getData = function (options) {
        return VectorService.getData(_.merge(options, eventseriesDataLayer));
      };

      return eventseriesDataLayer;

    };

  }

]);
