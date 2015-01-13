angular.module('scenarios')
  .controller("ScenariosCtrl", ["$scope", "Restangular", function ($scope, Restangular) {
  
  $scope.scenarios = [];
  $scope.selectedScenario = null;

  Restangular.all('api/v1/scenarios/').getList()
    .then(function (scenarios) {
      $scope.scenarios = scenarios;
    }); 
  

  $scope.select = function (scenario) {
    if ($scope.selectedScenario === null) {
      $scope.selectedScenario = scenario;
    } else if (scenario.id === $scope.selectedScenario.id) {
      $scope.selectedScenario = null;
    } else {
      $scope.selectedScenario = scenario;
    }
  };
  
}]);
