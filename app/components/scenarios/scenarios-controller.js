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

      var lgConfig = {
        "name": "Duivenpolder",
        "slug": "duifje",
        "active": true,
        "temporal": false,
        "temporal_resolution": 0,
        "opacity": 1.0,
        "order": 0,
        "baselayer": false,
        "layers": [
          {
            "slug": "nelenschuurmans.iaa79205",
            "type": "Raster",
            "format": "TMS",
            "min_zoom": 0,
            "max_zoom": 31,
            "z_index": 0,
            "url": "http://{s}.tiles.mapbox.com/v3",
            "tiled": true,
            "rescalable": false,
            "scale": "nominal",
            "quantity": null,
            "unit": null,
            "aggregation_type": "none",
            "load_order": null,
            "options": {},
            "bounds": {},
            "color": "",
            "event_count": 0
          }
        ]
      };
      var lg = DataService.createLayerGroup(lgConfig);
      DataService.toggleLayerGroup(lg);
      State.context = 'map';
    };

  }
]);
