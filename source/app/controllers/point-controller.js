'use strict';

/**
 * @ngdoc
 * @memberOf app
 * @class pointCtrl
 * @name pointCtrl
 * @description point is the contoller of the point template.
 * It gathers all data belonging to a location in space. It becomes active
 * by setting box.type to 'point' and is updated by broadcasting
 * 'newPointActive'. It reads and writes mapState.here.
 *
 * TODO:
 * - [ ] Include the click action on individual events into this paradigm.
 * - [ ] Remove all hardcoded shit. Mirror area and loop through
 *       all layers and perform generic actions based on layer types.
 */

app.controller('PointCtrl', ['$scope', 'LeafletService', 'CabinetService',
    'TimeseriesService', 'ClickFeedbackService',
  function ($scope, LeafletService, CabinetService, TimeseriesService, ClickFeedbackService) {

    $scope.point = {
      promCount: 0,
      wanted: CabinetService.wantedAttrs
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {

      ClickFeedbackService.drawClickInSpace($scope.mapState, here);

      var doneFn = function (response) { // response ::= True | False
        $scope.point.promCount--;
        if ($scope.point.promCount === 0) {
          ClickFeedbackService.stopVibration();
        }
      };

      var putDataOnScope = function (response) {
        var pointL = $scope.point[response.layerSlug] || {};

        if (!response || response.data === null) {
          console.log(response);
          pointL = undefined;
        } else {
          pointL.type = response.type;
          pointL.layerGroup = response.layerGroupSlug;
          pointL.data = response.data;

          if (response.data) {
            if (response.data.id) {
              getTimeSeriesForObject(response.data.entity_name + '$' + response.data.id);
            }
            if (response.data.geom) {
              // Draw feedback around object.
              ClickFeedbackService.drawGeometry($scope.mapState, response.data.geom, response.data.entity_name);
              // If the geom from the response is different than mapState.here
              // redo request to get the exact data for the centroid of the object.
              var geom = JSON.parse(response.data.geom);
              if (geom.coordinates[1] !== $scope.mapState.here.lat
                || geom.coordinates[0] !== $scope.mapState.here.lng) {
                $scope.mapState.here = LeafletService.latLng(geom.coordinates[1], geom.coordinates[0]);
              }
            } else {
              ClickFeedbackService.drawArrowHere($scope.mapState.here);
            }
          }
        }
        console.log('point:', $scope.point);
        $scope.point[response.layerSlug] = pointL;
      };

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {
        $scope.point.promCount++;
        layerGroup.getData({geom: here})
          .then(doneFn, doneFn, putDataOnScope);
      });
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description gets timeseries from service
     */
    var getTimeSeriesForObject = function (id) {
      TimeseriesService.getTimeseries(id, $scope.timeState)
      .then(function (result) {
        $scope.point.timeseries = $scope.point.timeseries ? $scope.point.timeseries : {};
        if (result.length > 0) {
          $scope.point.timeseries = $scope.point.timeseries ? $scope.point.timeseries : {};
          $scope.point.timeseries.active = true;
          $scope.point.timeseries.data = result[0].events;
          $scope.point.timeseries.name = result[0].name;
        } else {
          $scope.point.timeseries = undefined;
        }
      });
    };

    fillpoint($scope.mapState.here);

    // Update when user clicked again
    $scope.$watch('mapState.here', function (n, o) {
      if (n === o) { return; }
      fillpoint($scope.mapState.here);
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer($scope.mapState);
    });

    /**
     * Format the CSV (exporting rain data for a point in space/interval in
     * time) in a way that makes it comprehensible for les autres.
     *
     */
    $scope.formatCSVColumns = function (data) {
      var i,
        formattedDateTime,
        formattedData = [],
        lat = $scope.$parent.mapState.here.lat,
        lng = $scope.$parent.mapState.here.lng,
        _formatDate = function (epoch) {

          var d = new Date(parseInt(epoch, 1));

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
          Math.floor(100 * data[i][1]) / 100 || "0.00",
          lat,
          lng
        ]);
      }

      return formattedData;
    };

  }
]);
