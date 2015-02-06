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
      'MapService',
      'State',
      'TimeseriesService',
      function (
        Restangular,
        RasterService,
        MapService,
        State,
        TimeseriesService
        ) {


  /**
   * @function
   * @description fetches dashboard definitions from REST api.
   * A dashboard is fetched based on the user name.
   * A dashboard consists of "dashboardelements". These define
   * what every seperate slot should show to the user.
   *
   */
  var getDashboard = function (id) {
    return Restangular.one('api/v1/dashboards/').getList()
      .then(function (response) {
        return response;
      });
  };

  /**
   * @function
   * @description Every dashboardelement has data to show
   * not every dashboardelement shows the same kind of data. 
   * So perhaps in the future this should use the data-service
   * that is also being used for layergroup-service. At the moment
   * those two things are still very much dependent on each other.
   *
   */
  var getData = function (elements) {

    elements.forEach(function (el, i) {
      if (el.element_type === 'graph') {
        el.selectedTimeseries = { unit: 'unit'}
        TimeseriesService.getTimeseries(el.data.timeseries,
          el.temporal_bounds)
         .then(function (response) {
            el.dashboardData = response;
            if (response.length > 0){
              el.selectedTimeseries = el.dashboardData[0];
            }
          });
      } else if (el.element_type === 'rain') {
        var options = angular.extend({
          geom: L.latLng(el.latitude, el.longitude),
          agg: 'none'
       }, el.temporal_bounds);
        RasterService.getData({slug: 'rain'}, options)
          .then(function (response) {
            el.temporal_bounds.aggWindow = 300000;
            el.selectedTimeseries = response;
          });
      } else if (el.element_type === 'map') {
        State.layerGroups.active = el.data.map;
        MapService.setView(L.latLng(el.latitude, el.longitude),
              el.spatial_zoom);
      }

    });
  };

  return {
    getDashboard: getDashboard,
    getData: getData
  };
  
}]);
