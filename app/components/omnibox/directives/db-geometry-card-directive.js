
angular.module('omnibox')
.directive('dbGeometryCards', [ 'State', 'DBCardsService', 'DataService',
  function (State, DBCardsService, DataService) {
    return {
      link: function (scope) {

        scope.noData = true;

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {

          _.forEach(scope.geom.properties, function (property) {
            if (property.active === undefined
              && (
                scope.geom.geometry.type === 'LineString'
                || property.temporal
                )
              ) {
              scope.toggleProperty(property);
            }
          });

          var noRasterData = !_.some(scope.geom.properties, function (property) {
            return property;
          });

          scope.noData = noRasterData && scope.geom.entity_name === undefined;

        }, true);


        scope.toggleProperty = function (property) {

          if (!property.active) {
            var plots = DBCardsService.getActiveCountAndOrder();
            // On toggle, add seperate graph. Give order of highest order + 1.
            property.order = plots.count > 0
              ? plots.order + 1
              : 0;
            property.active = true;
          }

          else {
            DBCardsService.removeItemFromPlot(property);
            property.active = false;
          }

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
