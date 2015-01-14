
angular.module('scenarios')
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
