'use strict';

angular.module('omnibox')
.controller("ScenariosCtrl", [
  "$scope",
  "Restangular",
  "DataService",
  "State", function ($scope, Restangular, DataService, State) {

    $scope.scenarios = [];
    $scope.selectedScenario = null;

    // It is pretty imposible to make the table the right length without js.
    $scope.tableHeight = window.innerHeight - 150 + 'px';

    $scope.page = 1;

    $scope.getPage = function (page) {
      if (!page) {
        page = $scope.page;
      }
      $scope.loading = true;
      Restangular.one('api/v2/scenarios/?page=' + page).get()
        .then(function (response) {
          $scope.loading = false;
          // get the amount of pages for the ng-repeater
          var pages = Math.ceil(response.count / 10.0);
          $scope.pages = Array
                          .apply(null, new Array(pages))
                          .map(function (_, i) {return i + 1;});
          $scope.scenarios = response.results;
        });
    };

    $scope.getPage();

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
    };

  }
]);
