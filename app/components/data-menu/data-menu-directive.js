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

    var rmAllButLastAsset = function () {
      State.selected.assets.forEach(function (asset) {
        if (State.selected.assets.length > 1) {
          State.selected.assets.removeAsset(asset);
        }
      });
    };

    scope.changeBoxType = function () {
      if (scope.type === 'point'
        || scope.type === 'region'
        || scope.type === 'area') {
        State.selected.geometries = [];
        rmAllButLastAsset();
      }
      // TODO: enable line with others, only clicklayer is bitching.
      else if (scope.type === 'line') {
        State.selected.geometries = [];
        State.selected.assets = [];
      }
      scope.boxType = scope.type;
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
