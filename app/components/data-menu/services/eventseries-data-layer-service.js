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
  function (VectorService) {

    return function (options) {

      var eventseriesDataLayer = {};

      eventseriesDataLayer.uuid = options.uuid;

      eventseriesDataLayer.getData = function (options) {
        return VectorService.getData(_.merge(options, eventseriesDataLayer));
      };

      return eventseriesDataLayer;

    };

  }

]);
