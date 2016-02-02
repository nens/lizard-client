angular.module('omnibox')
  .controller("DashboardCardCtrl", ["DataService", function (DataService) {

  this.assets = DataService.assets;

}]);
