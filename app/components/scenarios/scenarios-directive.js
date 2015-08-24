'use strict';

angular.module('scenarios')
  .directive('scenarios', function () {
    var link =  function (scope) {
    };

  return {
    link: link,
    templateUrl: 'scenarios/scenarios.html',
    replace: false,
    restrict: 'E'
  };

});
