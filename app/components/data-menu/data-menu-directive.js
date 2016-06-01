'use strict';

/**
 * Data menu directives
 *
 * Overview
 * ========
 *
 * Defines the data menu.
 */
angular.module('data-menu')
  .directive('datamenu', ['dataLayers', 'DataService', 'State', function (dataLayers, DataService, State) {

    var link = function (scope, element, attrs) {

      scope.menu = {
        layerAdderEnabled: false,
        box: State.box,
        enabled: false
      };

      // Layers can be an object which fully describes all state of a
      // datasource.
      scope.layers = State.layers;

      // A layer in State.layers is part of dataLayers from the bootstrap object
      // or will be requested from the server.
      scope.dataLayers = dataLayers;

      var getActiveLayers = function (type) {
        return Object.keys(_.filter(scope.layers[type], 'active'));
      };

      var activeRasters = getActiveLayers('rasters');
      var activeExternalWMS = getActiveLayers('wms');

      scope.$watchCollection('layers.rasters', function () {
        var newActiveRasters = getActiveLayers('rasters');
        if (!_.isEqual(activeRasters, newActiveRasters)) {
          DataService.updateRaster();
        }
        activeRasters = newActiveRasters;
      });

      scope.$watchCollection('layers.wms', function () {
        var newActiveExternalWMS = getActiveLayers('wms');
        if (!_.isEqual(activeRasters, newActiveExternalWMS)) {
          DataService.updateExternalWMS();
        }
        activeExternalWMS = newActiveExternalWMS;
      });

    };

    return {
      link: link,
      scope: {},
      restrict: 'E',
      replace: true,
      templateUrl: 'data-menu/templates/data-menu.html'
    };

  }
]);
