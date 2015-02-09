angular.module("global-state", []);


/**
 * @name dataLayers
 * @memberOf app
 * @description Contains the dataLayers set by the server. Used by the
 *              map-directive and layer-chooser directive to build layer
 *              groups.
 */
angular.module('global-state')
  .constant('dataLayers', window.data_layers);

/**
 * @name dataBounds
 * @memberOf app
 * @description Contains the bounds of the data set by the server at load
 */
angular.module('global-state')
  .constant('dataBounds', window.data_bounds);

angular.module('global-state')
  .run(function (dataLayers, dataBounds) {
    if (!dataLayers) {
      throw new Error('No lizard-bs.js or no data layers in lizard-bs.js');
    }
  });
