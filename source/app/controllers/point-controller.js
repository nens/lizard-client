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

app.controller('PointCtrl', ['$scope', '$q', 'LeafletService', 'TimeseriesService', 'ClickFeedbackService',
  function ($scope, $q, LeafletService, TimeseriesService, ClickFeedbackService) {

    $scope.point = {};

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {

      var promises = [];

      var doneFn = function (response) {
        if (response.active === false) {
          $scope.point[response.slug] = undefined;
        }
      };

      var putDataOnScope = function (response) {
        var pointL;
        if (response.data === null) {
          pointL = undefined;
        } else {
          pointL = $scope.point[response.layerGroupSlug] || {};
          pointL.layerGroup = response.layerGroupSlug;
          pointL[response.layerSlug] = pointL[response.layerSlug] || {};
          pointL[response.layerSlug].type = response.type;
          pointL[response.layerSlug].data = response.data;
          pointL.layerGroupName = $scope.mapState.layerGroups[pointL.layerGroup].name;
          pointL.order = $scope.mapState.layerGroups[pointL.layerGroup].order;
          if (response.data && response.data.id) {
            getTimeSeriesForObject(response.data.entity_name + '$' + response.data.id);
          }
          if (response.data.geom) {
            // If the geom from the response is different than mapState.here
            // redo request to get the exact data for the centroid of the object.
            var geom = JSON.parse(response.data.geom);
            if (geom.type === 'Point' && (geom.coordinates[1] !== $scope.mapState.here.lat
              || geom.coordinates[0] !== $scope.mapState.here.lng)) {
              $scope.mapState.here = LeafletService.latLng(geom.coordinates[1], geom.coordinates[0]);
            }
          }
        }
        $scope.point[response.layerGroupSlug] = pointL;
      };

      ClickFeedbackService.drawClickInSpace($scope.mapState, here);

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {
        promises.push(layerGroup.getData({geom: here})
          .then(doneFn, doneFn, putDataOnScope));
      });

      // Draw feedback when all promises resolved
      $q.all(promises).then(drawFeedback);
    };

    var fillPointHere = function () {
      fillpoint($scope.mapState.here);
    };

    var drawFeedback = function () {
      ClickFeedbackService.stopVibration();
      if ($scope.point.waterchain) {

        ClickFeedbackService.drawGeometry(
          $scope.mapState,
          $scope.point.waterchain.waterchain_grid.data.geom,
          $scope.point.waterchain.waterchain_grid.data.entity_name
        );

      } else {

        angular.forEach($scope.point, function (lg) {
          if (lg) {
            ClickFeedbackService.drawArrowHere($scope.mapState);
            // return immediately to skip unneccesary loop iterations, kthxbai <3
            return;
          }
        });
      }
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description gets timeseries from service
     */
    var getTimeSeriesForObject = function (id) {
      TimeseriesService.getTimeseries(id, $scope.timeState)
      .then(function (result) {

        $scope.point.timeseries = $scope.point.timeseries || {};

        if (result.length > 0) {

          // NXT 1.0 style
          // -------------
          // $scope.point.timeseries.type = 'timeseries';
          // $scope.point.timeseries.data = result[0].events;
          // $scope.point.timeseries.name = result[0].name;
          // $scope.point.timeseries.order = 9999;


          // NXT 2.0 style
          // -------------
          angular.extend($scope.point.timeseries, {

            type  : 'timeseries',
            data  : result[0].events,
            name  : result[0].name,
            order : 9999
          });


        } else {
          $scope.point.timeseries = undefined;
        }
      });
    };

    fillPointHere();

    // Update when user clicked again
    $scope.$watch('mapState.here', function (n, o) {
      if (n === o) { return; }
      fillPointHere();
    });

    // Update when layergroups have changed
    $scope.$watch('mapState.layerGroupsChanged', function (n, o) {
      if (n === o) { return; }
      fillPointHere();
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer($scope.mapState);
    });
  }
]);
