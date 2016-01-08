angular.module('omnibox')
  .controller("DashboardCardCtrl", ["State", function (State) {

  this.selected = State.selected;

}]);
