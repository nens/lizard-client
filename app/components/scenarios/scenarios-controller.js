angular.module('scenarios')
.controller("ScenariosCtrl", [
  "$scope",
  "Restangular",
  "DataService",
  "State", function ($scope, Restangular, DataService, State) {

    $scope.scenarios = [];
    $scope.selectedScenario = null;

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
      angular.forEach(DataService.layerGroups, function (lg, slug) {
        if (slug !== 'elevation'
          && !lg.baselayer) {
          DataService.removeLayerGroup(lg);
        }
      });
      angular.forEach(scenario.result_set, function (result) {
        if (result.layer) {
          var lgConfig = {
            'name': scenario.name + ': ' + result.result_type.name,
            'slug': scenario.name + '_'  + result.result_type.code,
            "active": true,
            "temporal": false,
            "temporal_resolution": 0,
            "opacity": 1.0,
            "order": 0,
            "baselayer": false,
            "layers": [
              result.layer
            ]
          };
          var lg = DataService.createLayerGroup(lgConfig);
          DataService.toggleLayerGroup(lg);
        }
      });
      State.context = 'map';
    };

  }
]);
