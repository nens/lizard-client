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
          delete $scope.point[response.slug];
        }
        console.log(response);
      };

      var putDataOnScope = function (response) {
        console.log(response);
        var pointLg = $scope.point[response.layerGroupSlug] || {layers: {}};
        pointLg.layers[response.layerSlug] = pointLg.layers[response.layerSlug] || {};
        pointLg.layerGroupName = $scope.mapState.layerGroups[response.layerGroupSlug].name;
        pointLg.order = $scope.mapState.layerGroups[response.layerGroupSlug].order;
        if (response.data === null) {
          pointLg.layers[response.layerSlug].data = undefined;
        } else {
          pointLg.layers[response.layerSlug].type = response.type;
          pointLg.layers[response.layerSlug].data = response.data;

          /**
           * pointLg now looks like: {
           *   layerGroup: <slug>,
           *   layerGroupName: <name>,
           *   order: <order>,
           *   layers: {
           *     <layerSlug>: {
           *       data: <layer.data>,
           *       type: <layer.type>
           *     },
           *
           *     ...,
           *
           *   }
           * }
           */

        }
        if (response.data && response.data.id && response.data.entity_name) {
          getTimeSeriesForObject(response.data.entity_name + '$' + response.data.id);
        }
        $scope.point[response.layerGroupSlug] = pointLg;
      };

      ClickFeedbackService.drawClickInSpace($scope.mapState, here);

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {
        promises.push(layerGroup.getData({geom: here})
          .then(doneFn, doneFn, putDataOnScope));
      });

      // Draw feedback when all promises resolved
      $q.all(promises).then(drawFeedback);
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description Wrapper to improve readability
     */
    var fillPointHere = function () {
      fillpoint($scope.mapState.here);
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description Draw visual feedback after client clicked on the map
     */
    var drawFeedback = function () {
      var feedbackDrawn = false;
      ClickFeedbackService.stopVibration();
      console.log($scope.point);
      angular.forEach($scope.point, function (lg) {
        if (lg && lg.layers) {
          angular.forEach(lg.layers, function (layer) {
            if (layer.type === 'Vector') {
              // draw it
              feedbackDrawn = true;
            }
          });
        }
      });
      if ($scope.point.waterchain) {
        ClickFeedbackService.drawGeometry(
          $scope.mapState,
          $scope.point.waterchain.layers.waterchain_grid.data.geom,
          $scope.point.waterchain.layers.waterchain_grid.data.entity_name
        );
      } else if (!feedbackDrawn) {
        angular.forEach($scope.point, function (lg) {
          if (lg) {
            ClickFeedbackService.drawArrowHere($scope.mapState);
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
