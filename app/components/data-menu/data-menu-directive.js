'use strict';

/**
 * Data menu directive
 *
 * Overview
 * ========
 *
 * Defines the data menu.
 */
angular.module('lizard-nxt')
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