'use strict';

// this directive is implemented with the idea that we will switch to OL
// ie. ugly abuse of scope, sending data to server via
app.directive('rasterprofile', function () {

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

        // Draw a line and remove existing line (if exists).
        // borrow from 3di:
        // https://github.com/nens/threedi-server/blob/master/threedi_server/static/js/threedi-ng.js
        var drawLine = function (startpoint, endpoint) {
          var pointList = [startpoint, endpoint];
          var firstpolyline = L.polyline(pointList, {
            color: 'deeppink',
            weight: 2,
            opacity: 1,
            smoothFactor: 1
          });

          if (scope.line_marker !== undefined) {
            mapCtrl.removeLayer(scope.line_marker);
          }

          mapCtrl.addLayer(firstpolyline);
          scope.first_click = undefined;
          scope.line_marker = firstpolyline;  // Remember what we've added
          return firstpolyline;
        };
        
        var drawLineCLickHandler = function (e) {
          // setup draw line to get profile info from server 
          if (scope.first_click === undefined) {
            scope.first_click = e.latlng;
            console.log("Now click a second time to draw a line.");
            return;
          }

          var profile_line = drawLine(scope.first_click, e.latlng);
          var profile_line_wkt = toWKT(profile_line);
          
          // Aargh, FCK leaflet, why can't I get a proper CRS from a MAPPING
          // library
          var srs = L.CRS.EPSG3857.code;
          
          // call get_profile controller function on scope
          scope.get_profile(profile_line_wkt, srs);
        };

        // enable and disable click handler
        // 'tools.profile.enabled' is set by the MasterCtrl on <html> scope
        scope.$watch('tools.profile.enabled', function () {
          if (scope.tools.profile.enabled) {
            scope.map.on('click',  drawLineCLickHandler);
            angular.element(".icon-resize-full").toggleClass("icon-large");
          } else {
            //clean up map
            if (scope.line_marker) {
              mapCtrl.removeLayer(scope.line_marker);
              angular.element(".icon-resize-full").toggleClass("icon-large");
            }
            scope.map.off('click', drawLineCLickHandler);
          }
        });

      }

  };
});
