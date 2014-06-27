'use strict';

app.controller('DashboardDirCtrl', ['$scope', '$timeout', '$http', '$sce', function ($scope, $timeout, $http, $sce) {

  /*
   * TODO: This should build the dashboard according to a JSON object
   * which could come from a DashboardService or something, which in turn
   * persists/keeps its configuration for this user/organisation using the API
   *
   * TODO: good candidate for ui-router.
   * 
   */

  $scope.tabs = [];

  $scope.image = "http://redcube.nl/~freelink/lizard-nxt/gemeente_map_placeholder.png";
  $scope.table = "http://redcube.nl/~freelink/lizard-nxt/gemeente_map_placeholder.png";

  $scope.togglePeriod = function (period) {
    if (period === 'Month') {
      $scope.image = "http://redcube.nl/~freelink/lizard-nxt/gemeente_map_placeholder.png";
      $scope.table = "http://redcube.nl/~freelink/lizard-nxt/gemeente_map_placeholder.png";
    } else if (period === 'Year') {
      $scope.image = "http://redcube.nl/~freelink/lizard-nxt/object_map_placeholder.png";
      $scope.table = "http://redcube.nl/~freelink/lizard-nxt/object_map_placeholder.png";
    } else if (period === 'Quarter') {
      $scope.image = "http://redcube.nl/~freelink/lizard-nxt/bemgebied_map_placeholder.png";
      $scope.table = "http://redcube.nl/~freelink/lizard-nxt/bemgebied_map_placeholder.png";
    }
  };

}]);

app.directive('dashboard', ['$location', '$timeout', '$compile', function ($location, $timeout, $compile) {

  var link = function (scope, element, attrs, ctrl) {
  };

  return {
      restrict: 'E',
      scope: true,
      replace: true,
      controller: 'DashboardDirCtrl',
      templateUrl: 'templates/fullscreen.html',
      link: link
    };
}]);
