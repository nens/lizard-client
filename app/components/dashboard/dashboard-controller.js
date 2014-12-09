angular.module('dashboard')
  .controller("DashboardCtrl", ["$scope", function ($scope) {

  $scope.eventAggs = undefined;

  // dimensions are dependent on screen size.
  // this is calculated in directive.
  $scope.dimensions = {};

}]);
