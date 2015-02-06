/**
 *
 * Directive for dashboard component.
 *
 */
angular.module('dashboard')
  .controller('DashboardCtrl', [
      'DashboardService',
      function (DashboardService) {

    var that = this;
 
    DashboardService.getDashboard()
      .then(function (dashboard) {
        angular.extend(that, dashboard[0]);
          DashboardService.getData(that.dashboardelements);
        });
    
}]);
