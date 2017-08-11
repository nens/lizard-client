//layer-directive.js

angular.module('data-menu')
.directive('scenario', [
  '$http',
  'State',
  'LayerAdderService',
  'MapService',
  'gettextCatalog',
  function ($http, State, LayerAdderService, MapService, gettextCatalog) {
    var link = function (scope) {

      scope.translations = {
        scenarioData: gettextCatalog.getString('Export scenario data'),
        'arrival': gettextCatalog.getString('arrival times'),
        'maxwdepth': gettextCatalog.getString('max water depth'),
        'depth-first-dtri': gettextCatalog.getString('arrival times'),
        'depth-max-dtri': gettextCatalog.getString('max water depth'),
        'roads': gettextCatalog.getString('roads'),
        'vulnerable_buildings':
          gettextCatalog.getString('vulnerable buildings'),
        'damage_estimation_grid': gettextCatalog.getString('damage'),
        'damage_estimation_json': gettextCatalog.getString('damage.json'),
        'rise_velocity_grid': gettextCatalog.getString('rise velocity'),
        'water_velocity_grid': gettextCatalog.getString('velocity'),
        'hisssm_ozb': gettextCatalog.getString('HISSSM OZB'),
        'hisssm_damage': gettextCatalog.getString('damage'),
        'hisssm_casualties': gettextCatalog.getString('casualties'),
        'hisssm_csv': gettextCatalog.getString('HISSSM.csv'),
        'dem': gettextCatalog.getString('elevation'),
        's1-dtri': gettextCatalog.getString('water level'),
        'depth-dtri': gettextCatalog.getString('water depth'),
        'subgrid_map': gettextCatalog.getString('raw output'),
        'logfiles': gettextCatalog.getString('log files'),
        'flow-aggregate': gettextCatalog.getString('aggregated output'),
        'id-mapping': gettextCatalog.getString('id mapping'),
      };

      scope.state = State;

      scope.remove = LayerAdderService.remove;

      scope.scenario = {};

      // Set defaults.
      if (!scope.layer.name) {
        scope.layer.name = scope.layer.type + ' ' + scope.layer.uuid;
      }

      var getOrCreateLayer = function (layerConf, resultType) {
        var layer = _.find(State.layers, {uuid: layerConf.uuid});
        if (!layer) {
          layer = {uuid: layerConf.uuid.slice(0, 7), type: 'raster'};
          State.layers.push(layer);
        }
        layer.scenario = scope.layer.uuid;
        layer.name = scope.translations[resultType];
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

          LayerAdderService.fetchLayer(
            scope.layer.type + 's',
            scope.layer.uuid, scope.layer.name
          )

          .then(function (scenario) {
            scope.layer.active = true;

            // If the scenario did not have a name, check if the backend has one
            if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
              && scenario.name) {
              scope.layer.name = scenario.name;
            }

            scope.scenario = scenario;

            scenario.result_set.forEach(function (result) {
              if (result.raster) {
                result.layer = getOrCreateLayer(
                  result.raster,
                  result.result_type.code
                );
              }
            });

            // Custom sort to get rasters on top
            scenario.result_set.sort(function(a, b) {
              if(a.result_type.has_raster === false) {
                return 1;
              } else {
                return -1;
              }
            });

          })

          .catch(function () {
            scope.invalid = true;
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
        scope.layer.active = false;
        MapService.updateLayers([scope.layer]);

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

  }
]);
