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

        LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid, scope.layer.name)

        .then(function (scenario) {
          scope.layer.active = true;

          scope.layer.name = scenario.name;

          scope.scenario = scenario;

          scenario.result_set.forEach(function (result) {
            if (result.raster) {
              result.layer = getOrCreateLayer(result.raster, result.result_type.code);
            }
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
