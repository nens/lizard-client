'use strict';

/**
 * @ngdoc service
 * @class DataService /
 * @memberof app
 * @name DataService
 * @requires dataLayers and NxtData
 * @summary stores the global NxtData instance of the app.
 */

angular.module('lizard-nxt')
  .service('DataService', ['dataLayers', 'NxtData',
    function (dataLayers, NxtData) {
      return new NxtData(dataLayers, 'MapService');
    }
  ]);