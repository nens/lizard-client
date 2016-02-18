
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

          _.forEach(scope.geom.properties, function (property, slug) {
            if (property.active === undefined
              && (
                scope.geom.geometry.type !== 'Point'
                || property.slug === 'rain' // We really need to know whether it
                                            // is a temporal property.
                )
              ) {
              scope.toggleProperty(property);
            }
          });

          var noRasterData = scope.geom.properties && !Object.keys(scope.geom.properties);

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
