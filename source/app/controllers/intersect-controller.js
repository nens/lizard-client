app.controller("IntersectCtrl", [
  "$scope",
  "RasterService",
  "ClickFeedbackService",
  function ($scope, RasterService, ClickFeedbackService) {
    /**
     * lineIntersect is the object which collects different
     * sets of line data. If the intersect tool is turned on,
     * intersect is set to box.type and this controller becomes
     * active.
     *
     * Contains data of all active layers with a suitable aggregation_type
     *
     */
    $scope.lineIntersect = {};

    var firstClick, secondClick, updateExtentAgg, putDataOnscope, dataConvertToMeters,
        degToMeters, metersToDegs, removeDataFromScope, _updateLineIntersect;

    /**
     * Loops over all layers to request intersection data for all
     * active layers with a raster store path and an appropriate
     * aggregation_type type.
     *
     * @param  {wktstring}   line         str describing the line
     * @param  {object} layers   mapState.layers, containing
     *                                  nxt definition of layers
     * @param  {object} lineIntersect   lineIntersect object of this
     *                                  ctrl
     */
    updateExtentAgg = function (line, layers, lineIntersect) {
      angular.forEach(layers, function (layer, slug) {
        if (layer.active
          && layer.store_path
          && layer.aggregation_type !== 'counts') {
          var agg = lineIntersect[slug] || {},
              options = {wkt: line},
              dataProm = RasterService.getRasterData(slug, undefined, options);
          // Pass the promise to a function that handles the scope.
          putDataOnscope(dataProm, slug);
        } else if (slug in lineIntersect && !layer.active) {
          removeDataFromScope(slug);
        }
      });
    };

    /**
     * Puts dat on lineIntersect when promise resolves or
     * removes item from lineIntersect when no data is returned.
     *
     * @param  {promise}  dataProm       a promise with line data
     * @param  {str}      slug           slug name of layer
     */
    putDataOnscope = function (dataProm, slug) {
      dataProm.then(function (result) {
        if (result.length > 0) {
          $scope.lineIntersect[slug] = {};
          // convert degrees result to meters to display properly.
          $scope.lineIntersect[slug].data = dataConvertToMeters(result);
          $scope.lineIntersect[slug].name = $scope.mapState.layers[slug].name;
        } else if (slug in $scope.lineIntersect) {
          removeDataFromScope(slug);
        }
      });
    };

    /**
     * Takes data array with degrees as x-axis.
     * Returns array with meters as x-axis
     * @param  {array} data Array with degrees
     * @return {array} data Array with meters
     */
    dataConvertToMeters = function (data) {
      for (var i = 0; data.length > i; i++) {
        data[i][0] = degToMeters(data[i][0]);
      }
      return data;
    };

    /**
     * Takes degrees converts to radians 
     * and then converts to "haversine km's approximation" and then to meters
     * @param  {float} degrees 
     * @return {float} meters
     */
    degToMeters = function (degrees) {
      return  (degrees * Math.PI) / 180 * 6371 * 1000;
    };

    /**
     * Takes meters converts to radians 
     * and then converts degrees
     * @param  {float} meters 
     * @return {float} degrees
     */
    metersToDegs = function (meters) {
      return (meters / 1000 / 6371) * 180 / Math.PI;
    };

    removeDataFromScope = function (slug) {
      delete $scope.lineIntersect[slug];
    };

    /**
     * calls updateLineIntersect with a wkt representation of
     * input
     *
     * @param {object} firstClick
     * @param {object} secondClick
     */
    _updateLineIntersect = function (firstClick, secondClick) {
      var line = [
        "LINESTRING(",
        firstClick.lng,
        " ",
        firstClick.lat,
        ",",
        secondClick.lng,
        " ",
        secondClick.lat,
        ")"
      ].join('');
      updateExtentAgg(
        line,
        $scope.mapState.layers,
        $scope.lineIntersect
      );
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
    $scope.$watch('mapState.here', function (n, o) {
      if (n === o) { return true; }
      if (secondClick) {
        firstClick = undefined;
        secondClick = undefined;
        ClickFeedbackService.emptyClickLayer($scope.map);
      } else {
        if (firstClick) {
          secondClick = $scope.mapState.here;
          _updateLineIntersect(firstClick, secondClick);
          ClickFeedbackService.drawLine($scope.map, firstClick, secondClick, false);
        } else {
          firstClick = $scope.mapState.here;
          ClickFeedbackService.drawLine($scope.map, firstClick, $scope.mapState.userHere);
        }
      }
    });

    /**
     * Updates line according to geo-pos of mouse
     */
    $scope.$watch('mapState.userHere', function (n, o) {
      if (n === o) { return true; }
      if (firstClick && !secondClick) {
        ClickFeedbackService.drawLine($scope.map, firstClick, $scope.mapState.userHere, true);
      }
    });

    /**
     * Updates lineIntersect data when users changes layers.
     */
    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      if (firstClick && secondClick) {
        _updateLineIntersect(firstClick, secondClick);
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
        // local vars declaration.
        var lat1, lat2, lon1, lon2, maxD, d, r, dLat, dLon, posLat, posLon;

        lat1 = firstClick.lat;
        lat2 = secondClick.lat;
        lon1 = firstClick.lng;
        lon2 = secondClick.lng;
        maxD = Math.sqrt(Math.pow((lat2 - lat1), 2) + Math.pow((lon2 - lon1), 2));
        d = metersToDegs($scope.box.mouseLoc);
        r = d / maxD;
        dLat = (lat2 - lat1) * r;
        dLon = (lon2 - lon1) * r;
        posLat = dLat + lat1;
        posLon = dLon + lon1;
        if (circle === undefined) {
          circle = L.circleMarker([posLat, posLon], {
              color: '#2980b9',
              opacity: 1,
              fillOpacity: 1,
              radius: 5
            });
          $scope.map.addLayer(circle);
        } else {
          circle.setLatLng([posLat, posLon]);
        }
      }
      else {
        if (circle !== undefined) {
          $scope.map.removeLayer(circle);
          circle = undefined;
        }
      }
    });

    /**
     * Clean up all drawings on box change.
     */
    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer($scope.map);
    });

  }
]);
