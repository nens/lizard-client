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
.directive('datamenu', ['DataService', 'State', 'LayerAdderService', 'gettextCatalog',
  function (DataService, State, LayerAdderService, gettextCatalog) {

    var link = function (scope, element, attrs) {
      scope.translations = {
        pointSelection: gettextCatalog.getString('Point selection'),
        multiplePoints: gettextCatalog.getString('Select Multiple Points'),
        lineSelection: gettextCatalog.getString('Line selection'),
        regionSelection: gettextCatalog.getString('Region selection')
      };

      scope.menu = {
        layerAdderEnabled: false,
        box: State.box,
        enabled: false
      };

      Object.defineProperty(scope.menu, 'fullMenu', {
        get: function () {
          return scope.menu.layerAdderEnabled
          || LayerAdderService.getActiveScenarios().length > 0;
        }
      });

      scope.state = State;

      scope.filterScenarioRasters = function (stateLayers) {
        var scenarioRasterUUIDs = [];
        DataService.dataLayers.forEach(function (dataLayer) {
          if(dataLayer.slug.indexOf("scenarios") === 0) {
            scenarioRasterUUIDs.push(dataLayer.uuid);
          }
        });

        var result = [];
        stateLayers.forEach(function (stateLayer) {
          if (!_.includes(scenarioRasterUUIDs, stateLayer.uuid)) {
            result.push(stateLayer);
          }
        });
        return result;
      };

      scope.$watch('state.layers', function () {
        DataService.refreshSelected(scope.state.layers);
      }, true);

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
