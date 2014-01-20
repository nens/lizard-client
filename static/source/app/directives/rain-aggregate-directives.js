// rain-aggregate-directives.js
'use strict';

app.directive('rainAggregate', function ($q, Restangular) {
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


          // NOTE: first part hardcoded
    // var url = "api/v1/rasters/";
    // url += "?raster_names=" + raster_names;
    // url += "&geom=" + linestring_wkt;
    // url += "&srs=" + srs;
    // if (agg !== undefined) {
    //   url += "&agg=" + agg;  
    // }
    // var config = {
    //   method: 'GET',
    //   url: url
    // };
      var rasterResource = Restangular.one('api/v1/rasters/');

    scope.$watch('box.content.data', function (newVal, oldVal) {
      if(newVal === oldVal) { return};
      // debugger
      // console.info(newVal);
    });


      var rainClick = function (e) { 
        var stop = new Date;
        var stopString = stop.toISOString().split('.')[0];
        var start = new Date;
        start.setDate(stop.getDate() - 2);
        var startString = start.toISOString().split('.')[0];
        var wkt = "POINT(" + e.latlng.lng + " " + e.latlng.lat + ")";
        scope.mapState.timeout = $q.defer();
        // scope.getRasterData('rain', wkt, 'EPSG:4326', undefined, true);
        scope.box.type = "rain";
        rasterResource.get({
          raster_names: 'rain',
          geom: wkt,
          srs: 'EPSG:4236',
          start: startString,
          stop: stopString
        }).then(function (result) {
          scope.box.content.data = result;
        });
      };

      scope.$watch('tools.active', function (newVal, oldVal) {
          if (newVal === oldVal) { return; }
          if (newVal !== 'rain') {
            scope.map.off('click', rainClick);
            if (newVal === 'none') {
              scope.tools.cursorTooltip.enabled = false;
              scope.tools.cursorTooltip.content = "";  
            }
            //watch
            return;
            //link 
            return; 
          } else {
            scope.map.on('click', rainClick);
            scope.tools.cursorTooltip.enabled = true;
            scope.tools.cursorTooltip.content = "Click to get precipitation data for that location";
          }
        });
    }
  };
});