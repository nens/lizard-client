/**
 *
 * Directive for dashboard component.
 */
angular.module('dashboard')
  .directive('dashboard', function () {
  
  var link = function () {
    var rowHeight = (angular.element('body').height() - 70) / 2;
    angular.element('.dashboard-row').height(rowHeight);
  
  };


  return {
    link: link,
    replace: true,
    restrict: 'E',
    templateUrl: 'dashboard/dashboard.html'
  }
});
