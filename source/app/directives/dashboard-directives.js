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

  $scope.tabs = [{
      title: "Streetview",
      content: $sce.trustAsHtml("<h4>Streetview</h4>")
    },
    {
      title: "Extra",
      content: $sce.trustAsHtml("<h4>Extra</h4><p>Dynamic content 2</p>"),
      disabled: true
    }];
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
