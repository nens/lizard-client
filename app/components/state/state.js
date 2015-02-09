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
      document.getElementsByTagName('body')[0].innerHTML =
      '<div class="error-message error-text" style="height: 135px">' +
        'Oops, this is not what you were looking for.' +
        'If you have any questions, please contact us. ' +
        '<a href="mailto:servicedesk@nelen-schuurmans.nl?subject=Lizard">servicedesk@nelen-schuurmans.nl</a>' +
      '</div>';
      throw new Error('No lizard-bs.js or no data layers in lizard-bs.js');
    }

  });
