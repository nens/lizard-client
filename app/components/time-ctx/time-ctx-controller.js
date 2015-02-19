angular.module('time-ctx')
  .controller("TimeCtxCtrl", ["$scope", "State", function ($scope, State) {

  $scope.eventAggs = undefined;

  $scope.state = State;

  // dimensions are dependent on screen size.
  // this is calculated in directive.
  $scope.dimensions = {};

  // statistics (maybe get dynamically from event aggregation service?)
  $scope.stats = ['max', 'min', 'mean', 'sum', 'median', 'count'];

  // default selection
  $scope.selectedStat = $scope.selectedStat || $scope.stats[2];

}]);
