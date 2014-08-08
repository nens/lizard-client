app.controller("IntersectCtrl", [
  "$scope",
  "RasterService",
  "ClickFeedbackService",
  function ($scope, RasterService, ClickFeedbackService) {
    /**
     * lineIntersect is the object which collects different
     * sets of aggregation data. If there is no activeObject,
     * this is the default collection of data to be shown in the
     * client.
     *
     * Contains data of all active layers with an aggregation_type
     *
     */
    $scope.lineIntersect = {};

    var firstClick, secondClick;

    /**
     * Loops over all layers to request aggregation data for all
     * active layers with a raster store path and an appropriate
     * aggregation_type type.
     *
     * @param  {line object}   line     object describing the profile
     * @param  {layers object} layers   mapState.layers, containing
     *                                  nxt definition of layers
     * @param  {object} lineIntersect lineIntersect object of this
     *                                  ctrl
     */
    var updateExtentAgg = function (line, layers, lineIntersect) {
      angular.forEach(layers, function (layer, slug) {
        if (layer.active
          && layer.store_path
          && layer.aggregation_type !== 'counts') {
          var agg = lineIntersect[slug] || {};
          var options = {wkt: line};
          var dataProm = RasterService.getRasterData(slug, undefined, options);
          // Pass the promise to a function that handles the scope.
          console.log(dataProm);
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
     * @param  {promise}               a promise with aggregated data and
     *                                 the slug
     */
    var putDataOnscope = function (dataProm, slug) {
      dataProm.then(function (result) {
        if (result.length > 0) {
          $scope.lineIntersect[slug] = {};
          $scope.lineIntersect[slug].data = result;
          $scope.lineIntersect[slug].name = $scope.mapState.layers[slug].name;
        } else if (slug in $scope.lineIntersect) {
          removeDataFromScope(slug);
        }
      });
    };

    var removeDataFromScope = function (slug) {
      delete $scope.lineIntersect[slug];
    };

    /**
     * private function to eliminate redundancy: gets called
     * in multiple $watches declared locally.
     */

    var _updateLineIntersect = function (firstClcik, secondClick) {
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
     * Updates firsClick and or secondClick
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

    var userHereWatch = $scope.$watch('mapState.userHere', function (n, o) {
      if (n === o) { return true; }
      if (firstClick && !secondClick) {
        ClickFeedbackService.drawLine($scope.map, firstClick, $scope.mapState.userHere, true);
      }
    });

    /**
     * Updates lineIntersect when users changes layers.
     */
    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return true; }
      _updateLineIntersect(firstClick, secondClick);
    });

    var circle;
    $scope.$watch('box.mouseLoc', function (n, o) {
      if (n === o) { return true; }
      if ($scope.box.mouseLoc) {
        var lat1 = firstClick.lat;
        var lat2 = secondClick.lat;
        var lon1 = firstClick.lng;
        var lon2 = secondClick.lng;
        var maxD = Math.sqrt(Math.pow((lat2 - lat1), 2) + Math.pow((lon2 - lon1), 2));
        var d = $scope.box.mouseLoc;
        var r = d / maxD;
        var dLat = (lat2 - lat1) * r;
        var dLon = (lon2 - lon1) * r;
        var posLat = dLat + lat1;
        var posLon = dLon + lon1;
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

    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer($scope.map);
    });

  }
]);
