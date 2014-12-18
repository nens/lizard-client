'use strict';

/**
 * @ngdoc
 * @memberOf app
 * @class pointCtrl
 * @name pointCtrl
 * @description point is the controller of the point template.
 * It gathers all data belonging to a location in space. It becomes active
 * by setting box.type to 'point' and is updated by when State.spatila.here
 * changes
 */

angular.module('lizard-nxt')
.controller('PointCtrl', [
  '$scope',
  '$q',
  'LeafletService',
  'TimeseriesService',
  'ClickFeedbackService',
  'UtilService',
  'MapService',
  'State',

  function ($scope, $q, LeafletService, TimeseriesService, ClickFeedbackService, UtilService, MapService, State) {

    var GRAPH_WIDTH = 600;
    $scope.box.content = {};
    $scope.box.showFullTable = false;

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {
      ClickFeedbackService.drawCircle(MapService, here);
      ClickFeedbackService.startVibration(MapService);
      var aggWindow = State.temporal.aggWindow;
      var promises = $scope.fillBox({
        geom: here,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: aggWindow
      });

      angular.forEach(promises, function (promise) {
        promise.then(null, null, function (response) {
          if (response.data && response.data.id && response.data.entity_name) {
            getTimeSeriesForObject(
              response.data.entity_name + '$' + response.data.id
            );
          }
          if (response.layerSlug === 'radar/basic' && response.data !== null) {
            // this logs incessant errors.
            if ($scope.box.content[response.layerGroupSlug] === undefined) { return; }
            if (!$scope.box.content[response.layerGroupSlug].layers.hasOwnProperty(response.layerSlug)) { return; }

            // This could probably be different.
            $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed = 
              !$scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed;
            $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].aggWindow = aggWindow;
          }
          $scope.box.minimizeCards();
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
      if (State.spatial.here) {
        fillpoint(State.spatial.here);
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
              if (layer.format === 'Vector' && layer.data.length > 0) {
                ClickFeedbackService.drawGeometry(
                  MapService,
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
              entity_name: content.waterchain.layers.waterchain_grid.data.entity_name,
              type: content.waterchain.layers.waterchain_grid.data.type || ''
            }
          };
          ClickFeedbackService.drawGeometry(
            MapService,
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
                if (layer.format === 'Store' && layer.data.length > 0) {
                  ClickFeedbackService.drawArrow(MapService, State.spatial.here);
                  feedbackDrawn = true;
                }
              });
            }
          });
        }
      };

      ClickFeedbackService.emptyClickLayer(MapService);
      drawVectorFeedback($scope.box.content);
      drawUTFGridFeedback($scope.box.content);
      drawStoreFeedback($scope.box.content);
      if (!feedbackDrawn) {
        ClickFeedbackService.vibrateOnce({
          type: 'Point',
          coordinates: [State.spatial.here.lng, State.spatial.here.lat]
        });
      }
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description gets timeseries from service
     */
    var getTimeSeriesForObject = function (objectId) {

      TimeseriesService.getTimeseries(objectId, State.temporal)
      .then(function (result) {

        $scope.box.content.timeseries = $scope.box.content.timeseries || {};

        if (result.length > 0) {

          // We retrieved data for one-or-more timeseries, but do these actually
          // contain measurements, or just metadata? We filter out the timeseries
          // with too little measurements...

          var filteredResult = [];

          angular.forEach(result, function (value) {
            if (value.events.length > 1) {
              filteredResult.push(value);
            }
          });

          if (filteredResult.length > 0) {

            // IF we retrieve at least one timeseries with actual measurements,
            // we put the retrieved data on the $scope:

            $scope.box.content.timeseries.data = filteredResult;
            $scope.box.content.timeseries.selectedTimeseries = filteredResult[0];
          } else {

            // ELSE, we delete the container object for timeseries:
            delete $scope.box.content.timeseries;
          }

        } else {
          delete $scope.box.content.timeseries;
        }
      });
    };

    // Update when user clicked again
    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o) { return; }
      fillPointHere();
    });

    // Update when layergroups have changed
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return; }
      if (State.spatial.here.lat && State.spatial.here.lng) {
        fillPointHere();
      }
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer(MapService);
    });

  }
]);
