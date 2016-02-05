
angular.module('omnibox')
.directive('dbGeometryCards', [ 'State', 'DataService',
  function (State, DataService) {
    return {
      link: function (scope) {

        scope.noData = true;
        scope.noRasterData = true;

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {

          _.forEach(scope.geom.properties, function (property) {
            if (property.active === undefined) {
              property.active = true;
            }
          });

          scope.noRasterData = !_.some(scope.geom.properties, function (property) {
            return property.data && property.data.length > 1;
          });

          scope.noData = scope.noRasterData && scope.geom.entity_name === undefined;
        }, true);


        scope.toggleProperty = function (property) {
          property.active = !property.active;
          if (DataService.onGeometriesChange) {
            DataService.onGeometriesChange();
          }
        };

      },
      restrict: 'E',
      scope: {
        geom: '=',
        timeState: '=',
        header: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/db-geometry-cards.html'
    };
  }
]);
