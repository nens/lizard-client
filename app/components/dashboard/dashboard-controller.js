angular.module('dashboard')
  .controller("DashboardCtrl", ["$scope", "State", function ($scope, State) {

  $scope.eventAggs = undefined;

  $scope.state = State;

  // dimensions are dependent on screen size.
  // this is calculated in directive.
  $scope.dimensions = {};

  $scope.ylabels = {
    duration: 'Afhandeltijd',
    reports: 'Meldingen'
  };
}]);
