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

  $scope.image = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Maand.png";
  $scope.table = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Maand_tabel.png";

  $scope.togglePeriod = function (period) {
    if (period === 'Month') {
      $scope.image = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Maand.png";
      $scope.table = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Maand_tabel.png";
    } else if (period === 'Year') {
      $scope.image = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Jaar.png";
      $scope.table = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Jaar_tabel.png";
    } else if (period === 'Quarter') {
      $scope.image = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Kwartaal.png";
      $scope.table = "http://redcube.nl/~freelink/lizard-nxt/Onderhoud_Kwartaal_tabel.png";
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
