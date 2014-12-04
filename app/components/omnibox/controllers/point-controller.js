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
    $scope.box.showFullTable = false;

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {

      if ($scope.box.type !== 'point') { return; }

      ClickFeedbackService.drawCircle($scope.mapState, here);
      ClickFeedbackService.startVibration($scope.mapState);
      var aggWindow = $scope.timeState.aggWindow;
      var promises = $scope.fillBox({
        geom: here,
        start: $scope.timeState.start,
        end: $scope.timeState.end,
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
              entity_name: content.waterchain.layers.waterchain_grid.data.entity_name,
              type: content.waterchain.layers.waterchain_grid.data.type || ''
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
    var getTimeSeriesForObject = function (objectId) {

      TimeseriesService.getTimeseries(objectId, $scope.timeState)
      .then(function (result) {
        result = 
        [{"id": 1867, "url": "https://nxt.lizard.net/api/v1/timeseries/1867/", "last_value": null, "uuid": "47584429-2155-4069-92f0-61ba28710db6", "code": "Q.vul::second::1::300", "name": "Debiet (m3/h)", "value_type": "float", "first_value_timestamp": 1407063600000, "last_value_timestamp": 1417621500000, "parameter": null, "unit": "m3/h", "events": [[1417348800000, 75.69], [1417349100000, 72.0], [1417349400000, 68.94], [1417349700000, 75.35], [1417350000000, 75.35], [1417350300000, 77.14], [1417350600000, 77.14], [1417350900000, 79.02], [1417351200000, 73.64], [1417351500000, 72.0], [1417351800000, 70.43], [1417352100000, 68.94], [1417352400000, 70.43], [1417352700000, 68.94], [1417353000000, 64.8], [1417353300000, 64.8], [1417353600000, 63.53], [1417353900000, 58.91]]}, {"id": 2129, "url": "https://nxt.lizard.net/api/v1/timeseries/2129/", "last_value": -7.8, "uuid": "722e0d0a-6fe7-4e8d-a894-ae1b7eea70cf", "code": "ALMR006::nonequidistant::1::1", "name": "Waterhoogte (mNAP)", "value_type": "float", "first_value_timestamp": 1407063606000, "last_value_timestamp": 1417619686000, "parameter": null, "unit": "mNAP", "events": [[1417348700000, -7.5], [1417348812000, -7.8], [1417348888000, -8.0], [1417348919000, -7.8], [1417348964000, -7.5], [1417348979000, -7.4], [1417349027000, -7.5], [1417349111000, -7.8], [1417349166000, -8.0], [1417349200000, -7.8], [1417349247000, -7.5], [1417349263000, -7.4], [1417349316000, -7.5], [1417349399000, -7.8], [1417349460000, -8.0], [1417349493000, -7.8], [1417349537000, -7.5], [1417349551000, -7.4], [1417349592000, -7.5], [1417349661000, -7.8], [1417349710000, -8.0], [1417349742000, -7.8], [1417349785000, -7.5], [1417349800000, -7.4], [1417349856000, -7.5], [1417349944000, -7.8], [1417350027000, -8.0], [1417350056000, -7.8], [1417350098000, -7.5], [1417350112000, -7.4], [1417350158000, -7.5], [1417350237000, -7.8], [1417350292000, -8.0], [1417350323000, -7.8], [1417350365000, -7.5], [1417350380000, -7.4], [1417350452000, -7.5], [1417350551000, -7.8], [1417350619000, -8.0], [1417350650000, -7.8], [1417350691000, -7.5], [1417350705000, -7.4], [1417350753000, -7.5], [1417350825000, -7.8], [1417350875000, -8.0], [1417350906000, -7.8], [1417350950000, -7.5], [1417350964000, -7.4], [1417351022000, -7.5], [1417351115000, -7.8], [1417351184000, -8.0], [1417351216000, -7.8], [1417351261000, -7.5], [1417351277000, -7.4], [1417351317000, -7.5], [1417351384000, -7.8], [1417351431000, -8.0], [1417351465000, -7.8], [1417351511000, -7.5], [1417351527000, -7.4], [1417351576000, -7.5], [1417351658000, -7.8], [1417351716000, -8.0], [1417351750000, -7.8], [1417351797000, -7.5], [1417351813000, -7.4], [1417351861000, -7.5], [1417351925000, -7.8], [1417351969000, -8.0], [1417352004000, -7.8], [1417352051000, -7.5], [1417352066000, -7.4], [1417352119000, -7.5], [1417352200000, -7.8], [1417352261000, -8.0], [1417352294000, -7.8], [1417352340000, -7.5], [1417352355000, -7.4], [1417352394000, -7.5], [1417352457000, -7.8], [1417352501000, -8.0], [1417352535000, -7.8], [1417352582000, -7.5], [1417352598000, -7.4], [1417352644000, -7.5], [1417352719000, -7.8], [1417352772000, -8.0], [1417352807000, -7.8], [1417352856000, -7.5], [1417352873000, -7.4], [1417352915000, -7.5], [1417352985000, -7.8], [1417353037000, -8.0], [1417353073000, -7.8], [1417353123000, -7.5], [1417353139000, -7.4], [1417353183000, -7.5], [1417353256000, -7.8], [1417353310000, -8.0], [1417353347000, -7.8], [1417353398000, -7.5], [1417353415000, -7.4], [1417353456000, -7.5], [1417353524000, -7.8], [1417353569000, -8.0], [1417353609000, -7.8], [1417353665000, -7.5], [1417353683000, -7.4], [1417353735000, -7.5], [1417353797000, -7.8], [1417353841000, -8.0], [1417353882000, -7.8], [1417353939000, -7.5], [1417353959000, -7.4], [1417353995000, -7.5]]}, {"id": 2128, "url": "https://nxt.lizard.net/api/v1/timeseries/2128/", "last_value": -7.4, "uuid": "cd3af7fb-5818-411e-95bd-c8edc6e901bc", "code": "ALMR006::nonequidistant::1::1", "name": "Waterhoogte (mNAP)", "value_type": "float", "first_value_timestamp": 1407063610000, "last_value_timestamp": 1407927598000, "parameter": null, "unit": "mNAP", "events": []}];

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

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description Get correct icon for structure
     */
    $scope.getIconClass = function (str) {
      switch (str) {
      case 'overflow':
        return 'icon-overflow';
      case 'pumpstation':
        return 'icon-pumpstation-diesel';
      case 'bridge':
        return 'icon-bridge';
      case 'bridge-draw':
        return 'icon-bridge';
      case 'bridge-fixed':
        return 'icon-bridge';
      default:
        return 'icon-' + str;
      }
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description Toggling the view on the table for structure attributes;
     *              Either show the first 3 attributes, OR show all of them
     */
    $scope.box.toggleFullTable = function () {

      $scope.box.showFullTable = !$scope.box.showFullTable;

      d3.selectAll('tr.attr-row')
        .classed('hidden', function (_, i) {
          return i > 2 && !$scope.box.showFullTable;
        });
    };
  }
]);
