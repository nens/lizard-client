'use strict';

angular.module('omnibox')
  .directive('scenarios', function () {
    var link =  function () {
    };

  return {
    link: link,
    templateUrl: 'scenarios/scenarios.html',
    replace: true,
    restrict: 'E'
  };

});
