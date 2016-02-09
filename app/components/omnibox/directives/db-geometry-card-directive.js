
angular.module('omnibox')
.directive('dbGeometryCards', [ 'State',
  function (State) {
    return {
      link: function (scope) {

        scope.noData = true;
        scope.noRasterData = true;

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {

          scope.noRasterData = !_.some(scope.geom.properties, function (property) {
            return property.data && property.data.length > 1;
          });

          scope.noData = scope.noRasterData && scope.geom.entity_name === undefined;

        }, true);

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
