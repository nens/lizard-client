// rain-aggregate-directives.js
'use strict';

app.directive('rainAggregate', function ($q, Restangular) {
  return {
    restrict: "A",
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

    var rasterResource = Restangular.one('api/v1/rasters/');

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