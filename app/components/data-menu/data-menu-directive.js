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
  .directive('datamenu', [function () {

    var link = function (scope, element, attrs) {
    };


    return {
      link: link,
      restrict: 'E',
      replace: true,
      templateUrl: 'data-menu/data-menu.html'
    };

  }
]);

/**
 * @memberof datamenu
 * @description Makes the data menu items
 */
angular.module('data-menu')
  .directive('datamenuItem', ['State', function (State) {

  var link = function (scope, elem, attrs) {
    scope.changeBoxType = function () {
      scope.boxType = scope.type;
      if (scope.type === 'point') {
        var lastGeom = State.selected.geometries.length -1;
        State.selected.geometries = [State.selected.geometries[lastGeom]];
        var lastAsset = State.selected.assets.length -1;
        State.selected.assets = [State.selected.assets[lastAsset]];
      }
    };

  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    scope: {
      boxType: '=',
      type: '@',
      icon: '@'
    },
    templateUrl: 'data-menu/data-menu-item.html'
  };
}]);
