'use strict';

// this directive is implemented with the idea that we will switch to OL
// ie. ugly abuse of scope, sending data to server via
app.directive('rasterprofile', ['RasterService', function (RasterService) {

  return {
    restrict: "A",
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {
        // function to convert Leaflet layer to WKT
        // from https://gist.github.com/bmcbride/4248238
        // added project to 3857
        var toWKT =  function (layer) {
          var lng, lat, coords = [];
          if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
            var latlngs = layer.getLatLngs();
            for (var i = 0; i < latlngs.length; i++) {
              var point = L.CRS.EPSG3857.project(latlngs[i]);
              coords.push(point.x + " " + point.y);
              if (i === 0) {
                lng = point.x;
                lat = point.y;
              }
            }
            if (layer instanceof L.Polygon) {
              return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
            } else if (layer instanceof L.Polyline) {
              return "LINESTRING(" + coords.join(",") + ")";
            }
          } else if (layer instanceof L.Marker) {
            return "TODO: returns latlon instead of projected coordinates";
            //return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
          }
        };

        /* 
         * Draw a line and remove existing line (if exists).
         * borrow from 3di:
         * https://github.com/nens/threedi-server/blob/master/threedi_server/static/js/threedi-ng.js
         */
        var drawLine = function (startpoint, endpoint) {
          var pointList = [startpoint, endpoint];
          scope.line_marker.setLatLngs(pointList);
          scope.line_marker.options.dashArray = null;
          scope.line_marker._updateStyle();
          scope.firstClick = angular.copy(scope.first_click);
          scope.first_click = undefined;
          
        };

        var updateLine = function (e) {
          scope.line_marker.setLatLngs([scope.first_click, e.latlng]);
          scope.line_marker.options.dashArray = "5, 5";
          scope.line_marker._updateStyle();
          scope.lastClick = e.latlng;
        };

        var drawLineCLickHandler = function (e) {
          // setup draw line to get profile info from server  
          if (scope.first_click === undefined) {
            scope.first_click = e.latlng;
            if (scope.line_marker === undefined) {
              scope.line_marker = L.polyline([scope.first_click, scope.first_click], {
                color: '#2980b9',
                weight: 2,
                opacity: 1,
                smoothFactor: 1,
                dashArray: "5, 5"
              });
            } else {
              updateLine(e);
            }
            
            mapCtrl.addLayer(scope.line_marker);

            scope.map.on('mousemove', updateLine);
            return;
          }

          scope.map.off('mousemove', updateLine);
          drawLine(scope.first_click, e.latlng);

          var profile_line_wkt = toWKT(scope.line_marker);
          
          // Aargh, FCK leaflet, why can't I get a proper CRS from a MAPPING
          // library
          var srs = L.CRS.EPSG3857.code;
          
          RasterService.getRasterData('elevation', 'nogeom', {
                    agg: '',
                    srs: srs,
                    wkt: profile_line_wkt
                  }).then(function (data) {
                    scope.box.content = {
                      type: 'profile',
                      data: data,
                      yLabel: 'hoogte [mNAP]',
                      xLabel: 'afstand [m]'
                    }
                    scope.box.type = "profile"
                  });
        };

        // enable and disable click handler
        // 'tools.profile.enabled' is set by the MasterCtrl on <html> scope
        scope.$watch('tools.active', function () {
          if (scope.tools.active === "profile") {
            scope.map.on('click', drawLineCLickHandler);
          } else {
            if (scope.line_marker) {
              mapCtrl.removeLayer(scope.line_marker);
            }
            scope.map.off('click', drawLineCLickHandler);
          }
        });

        var circle;
        scope.$watch('box.mouseLoc', function (n, o) {
          if (n === o) { return true; }
          if (scope.box.mouseLoc !== undefined) {
            var lat1 = scope.firstClick.lat;
            var lat2 = scope.lastClick.lat;
            var lon1 = scope.firstClick.lng;
            var lon2 = scope.lastClick.lng;
            var maxD = scope.box.content.data[scope.box.content.data.length - 1][0];
            var d = scope.box.mouseLoc;
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
              mapCtrl.addLayer(circle);
            } else {
              circle.setLatLng([posLat, posLon]);
            }
          }
          else {
            if (circle !== undefined) {
              mapCtrl.removeLayer(circle);
              circle = undefined;
            }
          }
        });

      }

  };
}]);
