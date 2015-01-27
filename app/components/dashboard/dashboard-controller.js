/**
 *
 * Directive for dashboard component.
 */
angular.module('dashboard')
  .controller('DashboardCtrl', ['Restangular', 'DataService',
      function (Restangular, DataService) {

    
    this.DataService = DataService;
    this.elements = []; 

    var that = this;

    Restangular.one('api/v1/dashboards/1/').get()
      .then(function (dashboard) {
        that.elements = dashboard.dashboardelements;
      });

    this.elements.forEach(function (el, i) {
      DataService[el.data].getData({
        geom: 
      })
        .then(function (response) {
          el.data = response;
        });
    });
}]);
