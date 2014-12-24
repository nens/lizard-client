'use strict';

/**
 * @ngdoc service
 * @class DataService /
 * @memberof app
 * @name DataService
 * @requires dataLayers and NxtData
 * @summary stores the global NxtData instance of the app.
 */

angular.module('data-menu')
  .service('DataService', ['dataLayers', 'NxtData', 'State',
    function (dataLayers, NxtData, State) {
      var nxtData = new NxtData(dataLayers);
      State.layerGroups = nxtData.state;
      return nxtData;
    }
  ]);