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

angular.module('lizard-nxt')
  .controller('PointCtrl', ['$scope', '$q', 'LeafletService', 'TimeseriesService', 'ClickFeedbackService', 'UtilService',
  function ($scope, $q, LeafletService, TimeseriesService, ClickFeedbackService, UtilService) {

    var GRAPH_WIDTH = 600;
    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {
      ClickFeedbackService.drawClickInSpace($scope.mapState, here);
      var aggWindow = UtilService.getAggWindow($scope.timeState.start, $scope.timeState.end, GRAPH_WIDTH);
      var promises = $scope.fillBox({
        geom: here,
        start: $scope.timeState.start,
        end: $scope.timeState.end,
        aggWindow: aggWindow
      });
      angular.forEach(promises, function (promise) {
        promise.then(null, null, function (response) {
          if (response.data && response.data.id && response.data.entity_name) {
            getTimeSeriesForObject(response.data.entity_name + '$' + response.data.id);
          }
          $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].aggWindow = aggWindow;
        });
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
      angular.forEach($scope.box.content, function (lg) {
        if (lg && lg.layers) {
          angular.forEach(lg.layers, function (layer) {
            if (layer.type === 'Vector') {
              // draw it
              feedbackDrawn = true;
            }
          });
        }
      });
      if ($scope.box.content.waterchain && $scope.box.content.waterchain.layers.waterchain_grid) {
        ClickFeedbackService.drawGeometry(
          $scope.mapState,
          $scope.box.content.waterchain.layers.waterchain_grid.data.geom,
          $scope.box.content.waterchain.layers.waterchain_grid.data.entity_name
        );
      } else if (!feedbackDrawn) {
        angular.forEach($scope.box.content, function (lg) {
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

        $scope.box.content.timeseries = $scope.box.content.timeseries || {};

        if (result.length > 0) {

          angular.extend($scope.box.content.timeseries, {

            type  : 'timeseries',
            data  : result[0].events,
            name  : result[0].name,
            order : 9999
          });

        } else {
          delete $scope.box.content.timeseries;
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
