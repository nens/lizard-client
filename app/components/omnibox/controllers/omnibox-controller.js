angular.module('omnibox')
.controller("OmniboxCtrl", ["DataService", "State", "$scope",
  function (DataService, State, $scope) {

    this.data = DataService;
    this.state = State;

  }

]);
