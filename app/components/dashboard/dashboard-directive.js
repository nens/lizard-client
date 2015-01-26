/**
 *
 * Directive for dashboard component.
 */
angular.module('dashboard')
  .directive('dashboard', function () {
  

  return {
    link: function () {},
    replace: true,
    restrict: 'E',
    templateUrl: 'dashboard/dashboard.html'
  }
});
