/**
 *
 * Service for dashboard.
 *
 * This is responsible for:
 * * retrieving dashboard belonging to user (?)
 * * retrieving data for dashboardelements
 * * 
 *
 */
angular.module('dashboard')
  .service('DashboardService', ['Restangular', 'user', function (Restangular, user) {
  
  var getDashboard = function (id) {
    return Restangular.one('api/v1/dashboards', id).get()
      .then(function (response) {
        return response;
      })
  };

  return {
    getDashboard: getDashboard
  };
  
}]);
