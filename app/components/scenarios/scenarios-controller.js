angular.module('scenarios')
.controller("ScenariosCtrl", [
  "$scope",
  "Restangular",
  "DataService",
  "State", function ($scope, Restangular, DataService, State) {

    $scope.scenarios = [];
    $scope.selectedScenario = null;

    // It is pretty imposible to make the table the right length without js.
    $scope.tableHeight = window.innerHeight - 150 + 'px';

    Restangular.all('api/v1/scenarios/').getList()
      .then(function (scenarios) {
        $scope.scenarios = scenarios;
      });


    /**
     * @description Selects or deselects scenario.
     *
     */
    $scope.select = function (scenario) {
      if ($scope.selectedScenario === null) {
        $scope.selectedScenario = scenario;
      } else if (scenario.id === $scope.selectedScenario.id) {
        $scope.selectedScenario = null;
      } else {
        $scope.selectedScenario = scenario;
      }
    };

    $scope.preview = function (scenario) {
      angular.forEach(scenario.result_set, function (result) {
        if (result.layer_group) {
          var lg = DataService.createLayerGroup(result.layer_group);
          DataService.toggleLayerGroup(lg);
        }
      });
      $scope.transitionToContext('map');
    };

  }
]);
