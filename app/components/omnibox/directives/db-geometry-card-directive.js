
angular.module('omnibox')
.directive('dbGeometryCards', [ 'State',
  function (State) {
    return {
      link: function (scope) {

        scope.noRasterData = true;

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {

          _.forEach(scope.geom.properties, function (property) {
            scope.noRasterData = !(property.data && property.data.length > 1);
            return scope.noRasterData; // exit early.
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
