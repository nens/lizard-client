'use strict';

/**
 * @ngdoc
 * @memberOf app
 * @class pointCtrl
 * @name pointCtrl
 * @description point is the controller of the point template.
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
      if ($scope.box.type !== 'point') { return; }

      ClickFeedbackService.drawCircle($scope.mapState, here);
      ClickFeedbackService.startVibration($scope.mapState);
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
          if (response.layerSlug === 'radar/basic' && response.data !== null) {
            $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].aggWindow = aggWindow;
          }
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
      if ($scope.box.type === 'point' && $scope.mapState.here) {
        fillpoint($scope.mapState.here);
      }
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description Draw visual feedback after client clicked on the map
     */
    var drawFeedback = function () {
      var feedbackDrawn = false;
      var drawVectorFeedback = function (content) {
        angular.forEach(content, function (lg) {
          if (lg && lg.layers) {
            angular.forEach(lg.layers, function (layer) {
              if (layer.type === 'Vector' && layer.data.length > 0) {
                ClickFeedbackService.drawGeometry(
                  $scope.mapState,
                  layer.data
                );
                ClickFeedbackService.vibrateOnce();
                feedbackDrawn = true;
              }
            });
          }
        });
      };

      var drawUTFGridFeedback = function (content) {
        if (content.waterchain && content.waterchain.layers.waterchain_grid) {
          var feature = {
            type: 'Feature',
            geometry: angular.fromJson(content.waterchain.layers.waterchain_grid.data.geom),
            properties: {
              entity_name: content.waterchain.layers.waterchain_grid.data.entity_name
            }
          };
          ClickFeedbackService.drawGeometry(
            $scope.mapState,
            feature
          );
          ClickFeedbackService.vibrateOnce();
          feedbackDrawn = true;
        }
      };

      var drawStoreFeedback = function (content) {
        if (!feedbackDrawn) {
          angular.forEach(content, function (lg) {
            if (lg && lg.layers) {
              angular.forEach(lg.layers, function (layer) {
                if (layer.type === 'Store' && layer.data.length > 0) {
                  ClickFeedbackService.drawArrow($scope.mapState, $scope.mapState.here);
                  feedbackDrawn = true;
                }
              });
            }
          });
        }
      };

      ClickFeedbackService.emptyClickLayer($scope.mapState);
      drawVectorFeedback($scope.box.content);
      drawUTFGridFeedback($scope.box.content);
      drawStoreFeedback($scope.box.content);
      if (!feedbackDrawn) {
        ClickFeedbackService.vibrateOnce({
          type: 'Point',
          coordinates: [$scope.mapState.here.lng, $scope.mapState.here.lat]
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
