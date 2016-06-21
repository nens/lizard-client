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
  .directive('datamenu', ['DataService', 'State', function (DataService, State) {

    var link = function (scope, element, attrs) {

      scope.menu = {
        layerAdderEnabled: false,
        box: State.box,
        enabled: false
      };

      scope.state = State;

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
