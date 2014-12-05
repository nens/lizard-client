

angular.module('dashboard')
  //.directive('dashboard', ['NxtData', function (NxtData) {
  .directive('dashboard',
             ["EventAggregateService",
              function (EventAggregateService) {

  //  NxtData.getData(options);
  // Watch layergroups
  // get data for active event layergroups
  // aggregate it using eventaggregate service
  // draw full screen graph
  // watch time and get more data and aggregate using eventaggregate service
  //
  var link = function (scope, element, attrs) {
    console.log(attrs);
    //EventAggregateService.aggregate(response, scope.timeState.aggWindow);
  };

  return {
    link: link,
    templateUrl: 'dashboard/dashboard.html',
    restrict: 'E'
  };

}]);
