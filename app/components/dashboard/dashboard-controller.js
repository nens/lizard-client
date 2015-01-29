/**
 *
 * Directive for dashboard component.
 *
 */
angular.module('dashboard')
  .controller('DashboardCtrl', [
      'Restangular',
      'TimeseriesService',
      'DataService',
      'DashboardService',
      function (Restangular, TimeseriesService, DataService, DashboardService) {

    
    var DataService = DataService;

    var that = this;


    DashboardService.getDashboard(1) 
      .then(function (dashboard) {
        that.henkie="sdfsadf";
        angular.extend(that, dashboard);
          getDatas(that.dashboardelements);
        });
    
    var getDatas = function (elements) {

      elements.forEach(function (el, i) {
        if (el.data.hasOwnProperty('timeseries')) {
          TimeseriesService.getTimeseries(el.data.timeseries,
            el.temporal_bounds)
           .then(function (response) {
              el.dashboardData = response;
              if (response.length > 0){
                el.selectedTimeseries = el.dashboardData[0];
              }
            });
        } else if (el.data.hasOwnProperty('rain')) {
                              
        }

      });
    };
}]);
