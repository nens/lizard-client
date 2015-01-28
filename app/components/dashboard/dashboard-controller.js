/**
 *
 * Directive for dashboard component.
 */
angular.module('dashboard')
  .controller('DashboardCtrl', [
      'Restangular',
      'TimeseriesService',
      'DataService',
      function (Restangular, TimeseriesService, DataService) {

    
    var DataService = DataService;

    var that = this;

    Restangular.one('api/v1/dashboards/1/').get()
      .then(function (dashboard) {
        that = dashboard;
        return that.dashboardelements
      }).then(getDatas);
    
    var getDatas = function (elements) {

      elements.forEach(function (el, i) {
        TimeseriesService.getTimeseries(el.data.timeseries,
          el.temporal_bounds)
         .then(function (response) {
            el.dashboardData = response;
          });
      });
    };
}]);
