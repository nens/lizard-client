
angular.module('omnibox')
.directive('dbGeometryCards', [ 'State', 'DBCardsService', 'DataService',
  function (State, DBCardsService, DataService) {
    return {
      link: function (scope) {

        scope.noData = true;

        scope.dbSupportedData = function (type, property) {
          var temporal = property.temporal && type === 'Point';

          var events = property.format === 'Vector' && type !== 'LineString';

          var other = type !== 'Point'
            && property.scale !== 'nominal'
            && property.scale !== 'ordinal';

          return temporal || events || other;
        };

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {

          _.forEach(scope.geom.properties, function (property, slug) {
            if (!property.active
              && scope.dbSupportedData(
                scope.geom.geometry.type,
                property
              )) {
              scope.toggleProperty(property);
            }
          });

          // No raster data when properties is undefined or when properties is
          // empty object.
          var noRasterData = scope.geom.properties
            ? !Object.keys(scope.geom.properties).length
            : true;

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

        scope.$on('$destroy', function () {
          _.forEach(scope.geom.properties, function (property) {
            property.active = true;
            scope.toggleProperty(property);
          });
        });

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
