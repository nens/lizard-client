angular.module('dashboard')
  .controller("DashboardCtrl", ["$scope", function ($scope) {

  $scope.eventAggs = undefined;

  $scope.changeTimeState = function (timestamp) {
    $scope.timeState.at = parseInt(timestamp);
  };

  // dimensions are dependent on screen size.
  // this is calculated in directive.
  $scope.dimensions = {};

  $scope.ylabels = {
    duration: 'Afhandeltijd',
    reports: 'Meldingen'
  };
}]);
