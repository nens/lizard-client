'use strict';

angular.module('omnibox')
  .directive('scenarios', function () {
    var link =  function (scope) {
      console.log('i \'m getting another caller: ', scope.$$id)
    };

  return {
    link: link,
    templateUrl: 'scenarios/scenarios.html',
    replace: true,
    restrict: 'E'
  };

});
