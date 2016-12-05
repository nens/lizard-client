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
      // TODO: This is a wrapper around Vectorservice. Vectorservice is in lib.
      // As far as I can see Vectorservice is only (really) used by the
      // eventseriesdatalayer. Why do you do this for the eventseries datalayer,
      // but not for other layers? Or perhaps the other way around.

      var eventseriesDataLayer = options;

      eventseriesDataLayer.getData = function (options) {
        return VectorService.getData(_.merge(options, eventseriesDataLayer));
      };

      return eventseriesDataLayer;

    };

  }

]);
