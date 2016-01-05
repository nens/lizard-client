angular.module('omnibox')
  .controller("DashboardCtrl", ["State", function (State) {

  this.selected = State.selected;

}]);
