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
  .service('DashboardService', [
      'Restangular',
      'RasterService',
      'TimeseriesService',
      function (
        Restangular,
        RasterService,
        TimeseriesService
        ) {
  
  var getDashboard = function (id) {
    return Restangular.one('api/v1/dashboards', id).get()
      .then(function (response) {
        return response;
      })
  };


  var getData = function (elements) {

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
        var options = angular.extend({
          geom: L.latLng(el.spatial_bounds[0], el.spatial_bounds[1]),
          agg: 'none'
       }, el.temporal_bounds);
        RasterService.getData({slug: 'rain'}, options)
          .then(function (response) {
            el.temporal_bounds.aggWindow = 300000;
            el.selectedTimeseries = response;
          });
      }

    });
  };

  return {
    getDashboard: getDashboard,
    getData: getData
  };
  
}]);
