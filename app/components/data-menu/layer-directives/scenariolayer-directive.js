//layer-directive.js

angular.module('data-menu')
.directive('scenario', ['$http', 'State', 'LayerAdderService', 'gettextCatalog', function ($http, State, LayerAdderService, gettextCatalog) {
  var link = function (scope) {

    var RESULT_TYPES = {
      water_level: gettextCatalog.getString('water level'),
      arrival: gettextCatalog.getString('arrival times'),
      maxwdepth: gettextCatalog.getString('max water depth'),
      damage: gettextCatalog.getString('damage'),
      casualties: gettextCatalog.getString('casualties'),
      roads: gettextCatalog.getString('roads'),
      buildings: gettextCatalog.getString('buildings'),
      raw: gettextCatalog.getString('raw')
    };

    scope.state = State;

    scope.remove = LayerAdderService.remove;

    scope.scenario = {};

    var getOrCreateLayer = function (layerConf, resultType) {
      var layer = _.find(State.layers, {uuid: layerConf.uuid});
      if (!layer) {
        layer = layerConf;
        State.layers.push(layer);
      }
      layer.scenario = scope.layer.uuid;
      layer.name = RESULT_TYPES[resultType];
      return layer;
    };

    var forAllScenarioLayers = function (fn) {
      _.forEach(State.layers, function (layer) {
        if (layer.scenario && layer.scenario === scope.layer.uuid) {
          fn(layer);
        }
      });
    };

    var first = true;

    scope.$watch('layer.active', function () {
      if (scope.layer.active && first) {
        first = false;
        scope.layer.active = false;
        // TODO: uncommet when backend is implemented
        // LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid)

        // Mock
        scope.layer.name = 'Amstelmeerboezem';
        $http({
          url: 'scenario-mock.json',
          method: 'GET'
        })
        .then(function (response) {
          return response.data;
        })
        // End mock
        .then(function (scenario) {
          scope.layer.active = true;

          scope.scenario = scenario;

          scenario.results.forEach(function (result) {
            if (result.layer) {
              result.layer = getOrCreateLayer(result.layer, result.type);
            }
            result.name = RESULT_TYPES[result.type];
          });
        });
      }

      // Turn all scenario layers off.
      else if (!scope.layer.active) {
        _.forEach(State.layers, function (layer) {
          if (layer.scenario && layer.scenario === scope.layer.uuid) {
            layer.active = false;
          }
        });
      }

    });

    /**
     * Remove all scenario layers.
     */
    scope.$on('$destroy', function () {

      var scenarioLayers = [];

      _.forEach(State.layers, function (layer) {
        if (layer.scenario && layer.scenario === scope.layer.uuid) {
          scenarioLayers.push(layer);
        }
      });
      _.forEach(scenarioLayers, LayerAdderService.remove);

    });

  };

  return {
    link: link,
    scope: {
      layer: '=',
    },
    templateUrl: 'data-menu/templates/scenario.html',
    restrict: 'E',
  };

}]);
