angular.module('time-ctx')
  .controller("TimeCtxCtrl", ["$scope", "State", function ($scope, State) {

  this.eventAggs = undefined;

  this.state = State;

  // dimensions are dependent on screen size.
  // this is calculated in directive.
  this.dimens = {};

  // statistics (maybe get dynamically from event aggregation service?)
  this.stats = ['max', 'min', 'mean', 'sum', 'median', 'count'];

  // default selection
  this.selectedStat = this.selectedStat || this.stats[2];

}]);
