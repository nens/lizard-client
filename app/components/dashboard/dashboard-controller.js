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
 
    DashboardService.getDashboard(1) 
      .then(function (dashboard) {
        angular.extend(that, dashboard);
          DashboardService.getData(that.dashboardelements);
        });
    
}]);
