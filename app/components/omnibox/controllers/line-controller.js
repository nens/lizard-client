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
      ClickFeedbackService.startVibration();
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
          if ($scope.box.content[response.layerGroupSlug]
            && $scope.box.content[response.layerGroupSlug].layers.rain) {
            delete $scope.box.content[response.layerGroupSlug].layers.rain;
          }
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
     * Legacy function to draw 'bolletje'
     *
     * TODO
     */
    var circle;
    // Callback for mousemoved over graphs.
    this.mouseLocFn = function (position) {
      if (State.spatial.points[0] === undefined ||
          State.spatial.points[1] === undefined) {
        return;
      }

      if (position !== undefined) {

        // local vars declaration.
        var lat1, lat2, lon1, lon2, maxD, d, r, dLat, dLon, posLat, posLon;

        lat1 = State.spatial.points[0].lat;
        lat2 = State.spatial.points[1].lat;
        lon1 = State.spatial.points[0].lng;
        lon2 = State.spatial.points[1].lng;
        maxD = Math.sqrt(Math.pow((lat2 - lat1), 2) +
                         Math.pow((lon2 - lon1), 2));
        d = UtilService.metersToDegs(position);
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

    };

    /**
     * Clean up all drawings on box change and reject data.
     */
    $scope.$on('$destroy', function () {
      DataService.reject('omnibox');
      $scope.box.content = {};
      ClickFeedbackService.emptyClickLayer(MapService);
    });

    $scope.formatLineCSV = CSVService.formatLineCSV;
    $scope.getLineCSVHeaders = CSVService.getLineCSVHeaders;
  }
]);
