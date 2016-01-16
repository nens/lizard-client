angular.module('omnibox')
.controller("rain", [
  'RasterService',
  'UtilService',
  'State',
  '$scope',

  function (

    RasterService,
    UtilService,
    State,
    $scope

  ) {

      $scope.rrc = {
        active: false
      };

      $scope.recurrenceTimeToggle = function () {
        if (!$scope.$$phase) {
          $scope.$apply(function () {
            $scope.rrc.active = !$scope.rrc.active;
            $scope.lg.changed =
              !$scope.lg.changed;
          });
        } else {
          $scope.rrc.active = !$scope.rrc.active;
          $scope.lg.changed = !$scope.lg.changed;
        }
      };


      $scope.$watch("lg.changed", function (n, o) {
        if (n === o || !$scope.rrc.active) { return; }
        getRecurrenceTime();
      });

      var getRecurrenceTime = function () {
        $scope.rrc.data = null;

        // TODO: refactor this shit
        RasterService.getData(
          'RainController',
          {slug: 'rain'},
          {
            agg: 'rrc',
            geom: L.Latlng($scope.geom.geomtry.coordinates[1], $scope.geom.geomtry.coordinates[0]),
            start: State.temporal.start,
            end: State.temporal.end
          }
        ).then(function (response) {
          $scope.rrc.data = response;
        });
      };
    }
]);
