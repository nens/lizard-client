//layer-directive.js

angular.module('data-menu')
.directive('scenario', ['$http', 'State', 'LayerAdderService', 'gettextCatalog', function ($http, State, LayerAdderService, gettextCatalog) {
  var link = function (scope) {

    scope.RESULT_TYPES = {
      water_level: gettextCatalog.getString('water level'),
      arrival: gettextCatalog.getString('arrival times'),
      maxwdepth: gettextCatalog.getString('max water depth'),
      damage: gettextCatalog.getString('damage'),
      casualties: gettextCatalog.getString('casualties'),
      roads: gettextCatalog.getString('roads'),
      buildings: gettextCatalog.getString('buildings'),
    };

    scope.state = State;

    scope.remove = LayerAdderService.remove;

    // TODO rm this line.
    scope.layer.name = 'Amstelmeerboezem';

    scope.scenario = {};

    var first = true;

    scope.$watch('layer.active', function () {
      if (scope.layer.active && first) {
        first = false;
        scope.layer.active = false;
        // LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid)
        $http({
          url: 'scenario-mock.json',
          method: 'GET'
        })
        .then(function (response) {
          return response.data;
        })
        .then(function (scenario) {
          scope.layer.active = true;

          scope.scenario = scenario;

          scenario.results.forEach(function (result) {
            if (result.layer) {
              result.layer.scenario = scope.layer.uuid;
              result.layer.name = result.type;
              State.layers.push(result.layer);
            }
          });
        });
      }
      else if (!scope.layer.active) {
        // turn all layers off.
      }
    });

    scope.$on('$destroy', function () {
      // Remove all layers from scenario
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
