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
          ClickFeedbackService.drawLine($scope.map, firstClick, secondClick);
        } else {
          firstClick = $scope.mapState.here;
          ClickFeedbackService.drawLine($scope.map, firstClick, $scope.mapState.userHere);
        }
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
      console.log($scope.box.mouseLoc);
      if ($scope.box.mouseLoc) {
        var lat1 = firstClick.lat;
        var lat2 = secondClick.lat;
        var lon1 = firstClick.lng;
        var lon2 = secondClick.lng;
        var maxD = $scope.lineIntersect.data[$scope.lineIntersect[0].data.length - 1][0];
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

        // // function to convert Leaflet layer to WKT
        // // from https://gist.github.com/bmcbride/4248238
        // // added project to 3857
        // var toWKT =  function (layer) {
        //   var lng, lat, coords = [];
        //   if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
        //     var latlngs = layer.getLatLngs();
        //     for (var i = 0; i < latlngs.length; i++) {
        //       var point = L.CRS.EPSG3857.project(latlngs[i]);
        //       coords.push(point.x + " " + point.y);
        //       if (i === 0) {
        //         lng = point.x;
        //         lat = point.y;
        //       }
        //     }
        //     if (layer instanceof L.Polygon) {
        //       return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
        //     } else if (layer instanceof L.Polyline) {
        //       return "LINESTRING(" + coords.join(",") + ")";
        //     }
        //   } else if (layer instanceof L.Marker) {
        //     return "TODO: returns latlon instead of projected coordinates";
        //     //return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
        //   }
        // };

        // /*
        //  * Draw a line and remove existing line (if exists).
        //  * borrow from 3di:
        //  * https://github.com/nens/threedi-server/blob/master/threedi_server/static/js/threedi-ng.js
        //  */
        // var drawLine = function (startpoint, endpoint) {
        //   var pointList = [startpoint, endpoint];
        //   scope.line_marker.setLatLngs(pointList);
        //   scope.line_marker.options.dashArray = null;
        //   scope.line_marker._updateStyle();
        //   scope.firstClick = angular.copy(scope.first_click);
        //   scope.first_click = undefined;

        // };

        // var updateLine = function (e) {
        //   scope.line_marker.setLatLngs([scope.first_click, e.latlng]);
        //   scope.line_marker.options.dashArray = "5, 5";
        //   scope.line_marker._updateStyle();
        //   scope.lastClick = e.latlng;
        // };

      //   var drawLineCLickHandler = function (here) {
      //     // setup draw line to get profile info from server
      //       if (!line) {
      //         line = L.polyline([scope.first_click, scope.first_click], {
      //           color: '#2980b9',
      //           weight: 2,
      //           opacity: 1,
      //           smoothFactor: 1,
      //           dashArray: "5, 5"
      //         });
      //       } else {
      //         updateLine(e);
      //       }

      //       mapCtrl.addLayer(scope.line_marker);

      //       scope.map.on('mousemove', updateLine);
      //       return;
      //     }

      //     scope.map.off('mousemove', updateLine);
      //     drawLine(scope.first_click, e.latlng);

      //     var profile_line_wkt = toWKT(scope.line_marker);

      //     // library
      //     var srs = L.CRS.EPSG3857.code;

      //     RasterService.getRasterData('elevation', 'nogeom', {
      //       agg: '',
      //       srs: srs,
      //       wkt: profile_line_wkt
      //     }).then(function (data) {
      //       scope.box.content = {
      //         type: 'profile',
      //         data: data,
      //         yLabel: 'hoogte [mNAP]',
      //         xLabel: 'afstand [m]'
      //       };
      //       scope.box.type = "profile";
      //     });
      //   };

      //   // enable and disable click handler
      //   // 'tools.profile.enabled' is set by the MasterCtrl on <html> scope
      //   scope.$watch('tools.active', function () {
      //     if (scope.tools.active === "profile") {
      //       scope.map.on('click', drawLineCLickHandler);
      //     } else {
      //       if (scope.line_marker) {
      //         mapCtrl.removeLayer(scope.line_marker);
      //       }
      //       scope.map.off('click', drawLineCLickHandler);
      //     }
      //   });


      // }




  }
]);
