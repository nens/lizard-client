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

app.controller('PointCtrl', ['$scope', 'LeafletService', 'TimeseriesService', 'ClickFeedbackService',
  function ($scope, LeafletService, TimeseriesService, ClickFeedbackService) {

    var promCount;

    $scope.point = {};

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {

      var doneFn = function (response) { // response ::= True | False
        promCount--;
        if (promCount === 0) {
          ClickFeedbackService.stopVibration();
        }
      };

      var putDataOnScope = function (response) {
        var pointL = $scope.point[response.layerGroupSlug] || {};
        if (!response || response.data === null) {
          pointL = undefined;
        } else {
          pointL.layerGroup = response.layerGroupSlug;
          pointL.layerGroupName = $scope.mapState.layerGroups[pointL.layerGroup].name;
          pointL.order = $scope.mapState.layerGroups[pointL.layerGroup].order;
          pointL[response.layerSlug] = pointL[response.layerSlug] || {};
          pointL[response.layerSlug].type = response.type;
          if (response.data) {
            pointL[response.layerSlug].data = response.data;
            if (response.data.id) {
              getTimeSeriesForObject(response.data.entity_name + '$' + response.data.id);
            }
            if (response.data.geom) {
              // Draw feedback around object.
              ClickFeedbackService.drawGeometry($scope.mapState, response.data.geom, response.data.entity_name);
              // If the geom from the response is different than mapState.here
              // redo request to get the exact data for the centroid of the object.
              var geom = JSON.parse(response.data.geom);
              if (geom.type === 'Point' && (geom.coordinates[1] !== $scope.mapState.here.lat
                || geom.coordinates[0] !== $scope.mapState.here.lng)) {
                $scope.mapState.here = LeafletService.latLng(geom.coordinates[1], geom.coordinates[0]);
              }
            } else {
              ClickFeedbackService.drawArrowHere($scope.mapState, $scope.mapState.here);
            }
          }
        }
        $scope.point[response.layerGroupSlug] = pointL;
        console.log($scope.point);
      };

      ClickFeedbackService.drawClickInSpace($scope.mapState, here);

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {
        promCount++;
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
          $scope.point.timeseries.type = 'timeseries';
          $scope.point.timeseries.data = result[0].events;
          $scope.point.timeseries.name = result[0].name;
          $scope.point.timeseries.order = 9999;
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
  }
]);
