
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
              scope.toggleProperty(property);
            }
          });

          scope.noRasterData = !_.some(scope.geom.properties, function (property) {
            return property.data && property.data.length > 1;
          });

          scope.noData = scope.noRasterData && scope.geom.entity_name === undefined;

        }, true);


        scope.toggleProperty = function (property) {

          if (!property.active) {
            // On toggle, add seperate graph. Give order of highest order + 1.
            var orders = [];
            var actives = 0;

            DataService.assets.forEach(function (asset) {
              var lowestTS = _.maxBy(
                asset.timeseries,
                function (ts) {
                  if (ts.active) { actives++; }
                  return ts.active && ts.order; }
              );
              if (lowestTS) { orders.push(lowestTS.order); }

              _.forEach(
                asset.properties,
                function (property) {
                  if (property.active) {
                    actives++;
                    orders.push(property.order);
                  }
                }
              );
            });

            DataService.geometries.forEach(function (geometry) {
              _.forEach(
                geometry.properties,
                function (property) {
                  if (property.active) {
                    actives++;
                    orders.push(property.order);
                  }
                }
              );
            });

            property.order = actives > 0
              ? _.max(orders) + 1
              : 0;

            property.active = true;
          }

          else {

            var order = property.order;

            DataService.geometries.forEach(function (geometry) {
              _.forEach(geometry.properties, function (property) {
                if (property.order > order) { property.order--; }
              });
            });

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
