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

      /*
       * @description
       * angular isolate scope is messed with
       * when you using ng-if. This looks to parent
       * model and sets the local fullDetails.
       */
      $scope.$watch('box.fullDetails.rain', function (n) {
        $scope.fullDetails = n;
      });


      $scope.rrc = {
        active: false
      };

      $scope.recurrenceTimeToggle = function () {
        if (!$scope.$$phase) {
          $scope.$apply(function () {
            $scope.rrc.active = !$scope.rrc.active;
            $scope.lg.layers['rain'].changed =
             !$scope.lg.layers['rain'].changed;
          });
        } else {
          $scope.rrc.active = !$scope.rrc.active;
          $scope.lg.layers['rain'].changed = !$scope.lg.layers['rain'].changed;
        }
      };


      $scope.$watch("lg.layers['rain'].changed", function (n, o) {
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
            geom: State.spatial.here,
            start: State.temporal.start,
            end: State.temporal.end
          }
        ).then(function (response) {
          $scope.rrc.data = response;
        });
      };
    }
]);
