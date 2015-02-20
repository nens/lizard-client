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
            $scope.lg.layers['rain'].changed = !$scope.lg.layers['rain'].changed;
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
         {slug: 'rain'}, {
          agg: 'rrc',
          geom: State.spatial.here,
          start: State.temporal.start,
          end: State.temporal.end
        }).then(function (response) {
          $scope.rrc.data = response;
        });
      };

      /**
       * Format the CSV (exporting rain data for a point in space/interval in
       * time) in a way that makes it comprehensible for les autres.
       *
       */
      $scope.formatCSVColumns = function (data) {
        var i,
            formattedDateTime,
            formattedData = [],
            lat = State.spatial.here.lat,
            lng = State.spatial.here.lng,
            _formatDate = function (epoch) {
              var d = new Date(parseInt(epoch));
              return [
                [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('-'),
                [d.getHours() || "00", d.getMinutes() || "00", d.getSeconds() || "00"].join(':')
              ];
            };

        for (i = 0; i < data.length; i++) {

          formattedDateTime = _formatDate(data[i][0]);

          formattedData.push([
            formattedDateTime[0],
            formattedDateTime[1],
            UtilService.formatNumber(
              Math.floor(100 * data[i][1]) / 100 || 0,
              0,
              2,
              true // Dutchify seprators
            ),
            UtilService.formatNumber(lat, 0, 0, true),
            UtilService.formatNumber(lng, 0, 0, true)
          ]);
        }

        return formattedData;
      };

    }
]);
