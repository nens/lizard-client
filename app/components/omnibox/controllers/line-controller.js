angular.module('omnibox')
  .controller('LineCtrl', [

  '$scope',
  'RasterService',
  'ClickFeedbackService',
  'UtilService',
  '$q',
  'MapService',
  'DataService',
  'CSVService',
  'State',

  function (

    $scope,
    RasterService,
    ClickFeedbackService,
    UtilService,
    $q,
    MapService,
    DataService,
    CSVService,
    State) {

    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.lineCtrl
     * @description Gets data from DataService
     * @param  array of L.LatLng objects describing the line.
     */
    var fillLine = function (line) {
      ClickFeedbackService.startVibration(MapService);
      //TODO draw feedback when loading data
      var promise = $scope.fillBox({
        geom: line,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      });
      // Draw feedback when all promises are resolved
      promise.then(drawFeedback, drawFeedback, function (response) {
        if (response && response.data
           && response.layerSlug === 'dem/nl'
           // Prevent trying to fill $scope.box.content[response.layerGroupSlug]
           // when retrieved data wasn't rich enough for it's initialization:
           && $scope.box.content[response.layerGroupSlug]
        ) {
          // NB! In the backend, this data is already converted from degrees
          // to meters.
          $scope.box.content[response.layerGroupSlug]
            .layers[response.layerSlug]
            .data = response.data;
        } else if (response.layerSlug === 'rain') {
          // We dont wanna show intersect for rain (d.d. 20-01-2015)
          // if ($scope.box.content[response.layerGroupSlug].layers.rain) {
          //   delete $scope.box.content[response.layerGroupSlug].layers.rain;
          // }
        } else if (response.data && response.data !== 'null'
          && response.format === 'Store'
          && (response.scale === 'ratio' || response.scale === 'interval')
          && DataService.layerGroups[response.layerGroupSlug].temporal) {
          $scope.box.content[response.layerGroupSlug]
            .layers[response.layerSlug]
            .temporalData = response.data;
          $scope.box.content[response.layerGroupSlug]
            .layers[response.layerSlug]
            .data = UtilService.createDataForTimeState(
              $scope.box.content[response.layerGroupSlug]
                .layers[response.layerSlug]
                .temporalData,
              State.temporal
            );
        }
      });
    };

    /**
     * @function
     * @memberOf app.LineCtrl
     * @Description Looks a $scope.box.content to draw feedback
     *              for Store layers with data or provides feedback
     *              for not recieving any data.
     */
    var drawFeedback = function () {
      var feedbackDrawn = false;
      angular.forEach($scope.box.content, function (lg) {
        if (lg && lg.layers) {
          angular.forEach(lg.layers, function (layer) {
            if (layer && layer.data && layer.data.length > 0) {
              ClickFeedbackService.emptyClickLayer(MapService);
              ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
              ClickFeedbackService.vibrateOnce();
              feedbackDrawn = true;
            }
          });
        }
      });
      if (!feedbackDrawn) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.vibrateOnce({
          type: 'LineString',
          coordinates: [
            [State.spatial.points[0].lng, State.spatial.points[0].lat],
            [State.spatial.points[1].lng, State.spatial.points[1].lat]
          ]
        });
      }
    };

    /**
     * Updates firsClick and or secondClick and draws
     * appropriate feedback
     *
     * It either:
     *   1. Removes the current line
     *   2. Sets firstClick and draws a tiny line from the first
     *      click to the current pos of mouse.
     *   3. Sets the second click and draws the lne from
     *      the first to the second.
     */
    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o) { return true; }
      ClickFeedbackService.emptyClickLayer(MapService);
      if (State.spatial.points.length === 2) {
        State.spatial.points = [];
        // Empty data element since the line is gone
        $scope.box.content = {};
      } else {
        if (State.spatial.points.length === 1) {
          State.spatial.points[1] = State.spatial.here;
          ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
          fillLine(State.spatial.points);
        } else {
          State.spatial.points[0] = State.spatial.here;
          ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.userHere, true);
        }
      }
    });

    var watchIfUrlCtrlSetsPoints = $scope.$watch(State.toString('spatial.points'), function (n, o) {
      if (State.spatial.points.length === 2) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
        fillLine(State.spatial.points);
        // Delete this watch
        watchIfUrlCtrlSetsPoints();
      }
    });

    /**
     * Updates line according to geo-pos of mouse
     */
    $scope.$watch(State.toString('spatial.userHere'), function (n, o) {
      if (n === o) { return true; }
      if (State.spatial.points[0] && !State.spatial.points[1]) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.userHere, true);
      }
    });

    /**
     * Updates line data when users changes layers.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      if (State.spatial.points.length === 2) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
        fillLine(State.spatial.points);
      }
    });

    /**
     * Updates line of temporal layers when timeState.at changes.
     */
    $scope.$watch(State.toString('temporal.at'), function (n, o) {
      angular.forEach($scope.box.content, function (lg, slug) {
        if (DataService.layerGroups[slug].temporal) {
          angular.forEach(lg.layers, function (layer) {
            if (layer.format === 'Store'
              && (layer.scale === 'ratio' || layer.scale === 'interval')) {
              layer.data = UtilService.createDataForTimeState(layer.temporalData, State.temporal);
            }
          });
        }
      });
    });

    /**
     * Reload data from temporal rasters when temporal zoomended.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      if (!State.temporal.timelineMoving
        && State.spatial.points.length === 2) {
        fillLine(State.spatial.points);
      }
    });

    /**
     * Legacy function to draw 'bolletje'
     *
     * TODO
     */
    var circle;
    $scope.$watch('box.mouseLoc', function (n, o) {
      if (n === o) { return true; }
      if ($scope.box.mouseLoc) {

        if (State.spatial.points[0] === undefined ||
            State.spatial.points[1] === undefined) {
          return;
        }

        // local vars declaration.
        var lat1, lat2, lon1, lon2, maxD, d, r, dLat, dLon, posLat, posLon;

        lat1 = State.spatial.points[0].lat;
        lat2 = State.spatial.points[1].lat;
        lon1 = State.spatial.points[0].lng;
        lon2 = State.spatial.points[1].lng;
        maxD = Math.sqrt(Math.pow((lat2 - lat1), 2) +
                         Math.pow((lon2 - lon1), 2));
        d = UtilService.metersToDegs($scope.box.mouseLoc);
        r = d / maxD;
        dLat = (lat2 - lat1) * r;
        dLon = (lon2 - lon1) * r;
        posLat = dLat + lat1;
        posLon = dLon + lon1;
        if (circle === undefined) {
          circle = L.circleMarker([posLat, posLon], {
              color: '#c0392b',
              opacity: 1,
              fillOpacity: 1,
              radius: 5
            });
          MapService.addLeafletLayer(circle);
        } else {
          circle.setLatLng([posLat, posLon]);
        }
      }
      else {
        if (circle !== undefined) {
          MapService.removeLeafletLayer(circle);
          circle = undefined;
        }
      }
    });

    /**
     * Clean up all drawings on box change and reject data.
     */
    $scope.$on('$destroy', function () {
      DataService.reject();
      $scope.box.content = {};
      State.spatial.points = [];
      ClickFeedbackService.emptyClickLayer(MapService);
    });

    $scope.formatLineCSV = CSVService.formatLineCSV;
    $scope.getLineCSVHeaders = CSVService.getLineCSVHeaders;
  }
]);
