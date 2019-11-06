//layer-directive.js

angular.module('data-menu')
.directive('scenario', [
  '$http',
  'State',
  'DataService',
  'LayerAdderService',
  'MapService',
  'ExportRastersService',
  'gettextCatalog',
  '$timeout',
  'FavouritesService',
  function ($http, State, DataService, LayerAdderService, MapService, ExportRastersService, gettextCatalog, $timeout, FavouritesService) {
    var link = function (scope) {
      var RESULT_TYPES = {
        'arrival': gettextCatalog.getString('Arrival times'),
        'maxwdepth': gettextCatalog.getString('Max water depth'),
        'depth-first-dtri': gettextCatalog.getString('Arrival times'),
        'depth-max-dtri': gettextCatalog.getString('Max water depth'),
        's1-max-dtri': gettextCatalog.getString('Max water level'),
        'roads': gettextCatalog.getString('Roads'),
        'vulnerable_buildings':
          gettextCatalog.getString('Vulnerable buildings'),
        'damage_estimation_grid': gettextCatalog.getString('Damage'),
        'damage_estimation_json': gettextCatalog.getString('damage.json'),
        'rise_velocity_grid': gettextCatalog.getString('Rise velocity'),
        'water_velocity_grid': gettextCatalog.getString('Velocity'),
        'hisssm_ozb': gettextCatalog.getString('HISSSM OZB'),
        'hisssm_damage': gettextCatalog.getString('Damage'),
        'hisssm_casualties': gettextCatalog.getString('Casualties'),
        'hisssm_csv': gettextCatalog.getString('HISSSM.csv'),
        'dem': gettextCatalog.getString('Elevation'),
        's1-dtri': gettextCatalog.getString('Water level'),
        'depth-dtri': gettextCatalog.getString('Water depth'),
        'subgrid_map': gettextCatalog.getString('Raw output'),
        'logfiles': gettextCatalog.getString('Log files'),
        'flow-aggregate': gettextCatalog.getString('Aggregated output'),
        'id-mapping': gettextCatalog.getString('ID mapping'),
        'rise-velocity-quad': gettextCatalog.getString('Rise velocity'),
        'ucr-max-quad': gettextCatalog.getString('Max flow velocity'),
        'flood-hazard-rating': gettextCatalog.getString('Flood hazard rating'),
        'direct-damage': gettextCatalog.getString('Damage (direct)'),
        'indirect-damage': gettextCatalog.getString('Damage (indirect)'),
        'damage-summary': gettextCatalog.getString('Damage summary (csv)'),
        'total-damage': gettextCatalog.getString('Total damage'),
        'dmge-depth': gettextCatalog.getString('Waterdepth (damage)'),
        'rain-quad': gettextCatalog.getString('Rain')
      };

      scope.state = State;

      scope.remove = function (layer) { 
        layer.active = !layer.active;
        window.setTimeout(function() { LayerAdderService.remove(layer); }, 0); 
      };

      scope.scenario = {};

      // Set defaults.
      if (!scope.layer.name) {
        scope.layer.name = scope.layer.type + ' ' + scope.layer.uuid;
      }

      var getOrCreateLayer = function (layerConf, resultType) {
        var shortUuid = layerConf.uuid.slice(0, 7);
        var layer = _.find(State.layers, { uuid: shortUuid });

        if (!layer) {
          // This implies the layer (for a scenario) was NOT found in the URL
          layer = {
            uuid: shortUuid,
            type: 'raster'
          };
          State.layers.push(layer);
        } else {
          var appliedFavourite = FavouritesService.getAppliedFavourite();
          if (appliedFavourite) {
            // This implies the layer (for a scenario) was found in a favourite,
            // and the (State-) layer's activation depends on whether the layer
            // was activated when it was saved to the favourite:
            var favLayer = _.find(
              appliedFavourite.state.layers,
              { uuid: layer.uuid }
            );
            layer.active = !!favLayer.active;
          } else {
            // This implies the layer (for a scenario) was found in the URL, which
            // can only happen when it was previously activated; we need to set it
            // to active=true
            layer.active = true;
          }
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

          LayerAdderService.fetchLayer(
            scope.layer.type + 's',
            scope.layer.uuid,
            scope.layer.name
          )
          .then(function (scenario) {
            scope.layer.active = true;

            // If the scenario did not have a name, check if the backend has one
            if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
              && scenario.name) {
              scope.layer.name = scenario.name;
            }

            scope.scenario = scenario;
            if (scope.scenario.start_time_sim) {
              
              scope.formattedStartTime = moment(scope.scenario.start_time_sim).format('l') + ' ' + 
                moment(scope.scenario.start_time_sim).format('LTS');
              
              scope.formattedEndTime = moment(scope.scenario.end_time_sim).format('l') + ' ' + 
                moment(scope.scenario.end_time_sim).format('LTS');
              
              var timezoneString = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (timezoneString) {
                var timezoneStringAbbrevated = moment.tz(scope.scenario.start_time_sim, timezoneString).format('z');
                scope.formattedStartTime = scope.formattedStartTime + ' ' + timezoneStringAbbrevated;
                scope.formattedEndTime = scope.formattedEndTime + ' ' + timezoneStringAbbrevated;
              } 
            }
           

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

      scope.mustEnableExportBtn = function (result) {
        var shortUUID = State.shortenUUID(result.raster.uuid);
        return result.layer.active
          && DataService.layerIntersectsExtent(shortUUID);
      };

      scope.launchExportModal = function (result) {
        var shortUuid = State.shortenUUID(result.raster.uuid);
        $timeout(function () {
          var clickableBtnElem = $('#user-menu-export-btn');
          clickableBtnElem.trigger('click');
          var tabElem = $('#export-modal-tab-btn-rasters');
          tabElem.trigger('click');
          $timeout(function () {
            ExportRastersService.setSelectedRaster(shortUuid);
          });
        });
      };
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
