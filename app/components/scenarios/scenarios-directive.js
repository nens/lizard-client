'use strict';

angular.module('omnibox')
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
