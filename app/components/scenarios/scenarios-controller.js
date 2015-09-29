'use strict';

angular.module('scenarios')
.controller("ScenariosCtrl", [
  "$scope",
  "Restangular",
  "MapService",
  "DataService",
  "State", function ($scope, Restangular, MapService, DataService, State) {

    var PAGE_SIZE = 10.0,
        TABLE_MARGIN = 150;

    $scope.scenarios = [];
    $scope.selectedScenario = null;

    // It is pretty imposible to make the table the right length without js.
    $scope.tableHeight = window.innerHeight - TABLE_MARGIN + 'px';

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
          var pages = Math.ceil(response.count / PAGE_SIZE);
          $scope.pages = _.range(1, pages + 1);
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
        Restangular.one('api/v2/scenarios/' + scenario.id + '/').get()
          .then(function (response) {
            angular.extend(scenario, response);
          });
      } else if (scenario.id === $scope.selectedScenario.id) {
        $scope.selectedScenario = null;
      } else {
        $scope.selectedScenario = scenario;
      }
    };

    $scope.preview = function (result) {
      if (result.layer_group && !result.lg) {
        result.lg = DataService.createLayerGroup(result.layer_group);
        MapService.fitBounds(result.lg.spatialBounds);
      }
      if (result.lg) {
        DataService.toggleLayerGroup(result.lg);
      }
    };

  }
]);
