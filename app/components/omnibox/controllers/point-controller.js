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

angular.module('omnibox')
.controller('PointCtrl', [

  '$scope',
  '$q',
  'LeafletService',
  'ClickFeedbackService',
  'UtilService',
  'MapService',
  'DataService',
  'State',

  function (
    $scope,
    $q,
    LeafletService,
    ClickFeedbackService,
    UtilService,
    MapService,
    DataService,
    State
  ) {

    var GRAPH_WIDTH = 600;
    $scope.box.content = {};

    /**
     * @function
     * @summary Fills box content data for point.
     * @description Fills the point data based on the data layers that are
     * active (e.g. timeseries and waterchain information.
     *
     * Scope is inherited from OmniboxCtrl. Fillbox function from that controller
     * is called here.
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {
      ClickFeedbackService.drawCircle(MapService, here);
      ClickFeedbackService.startVibration();
      var aggWindow = State.temporal.aggWindow;
      var promise = $scope.fillBox({
        geom: here,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: aggWindow
      });

      // Draw feedback when all promises resolved
      promise.then(drawFeedback, null, function (response) {
        if (response && response.data) {
          // If we deal with raster data....
          if (response.layerSlug === 'rain' &&
              response.data && response.data.data !== null) {
            if ($scope.box.content[
                  response.layerGroupSlug] === undefined) { return; }
            if (!$scope.box.content[response.layerGroupSlug].layers.hasOwnProperty(response.layerSlug)) { return; }

            // This could probably be different..
            $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed =
              !$scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed;
            $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].aggWindow = aggWindow;
          }
        }
      });
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
    var drawFeedback = function (reason) {
      if (reason === 'overridden') { return; } // keep vibrating, other calls
                                               // will finish.
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

    $scope.isUrl = UtilService.isUrl;

    // CSV formatter
    $scope.formatCSVColumns = function (data) {
      return UtilService.formatCSVColumns(data, State.spatial.here);
    };

    // Update when user clicked again
    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o) { return; }
      fillPointHere();
    });

    // Update when layergroups have changed
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return; }
      if (State.spatial.here
        && State.spatial.here.lat
        && State.spatial.here.lng) {
        fillPointHere();
      }
    });

    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (!State.temporal.timelineMoving) {
        if (State.spatial.here
          && State.spatial.here.lat
          && State.spatial.here.lng) {
          fillPointHere();
        }
      }
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      DataService.reject('omnibox');
      $scope.box.content = {};
      State.spatial.points = [];
      ClickFeedbackService.emptyClickLayer(MapService);
    });
  }
]);
