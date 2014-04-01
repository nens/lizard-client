// rain-aggregate-directives.js
'use strict';

app.directive('rainAggregate', function ($q, CabinetService) {
  return {
    restrict: "A",
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      var rainClick = function (e) {
        // rain retrieve
        var stop = new Date(scope.timeState.end);
        var start = new Date(scope.timeState.start);
        var latLng = e.latlng;
        scope.box.type = 'rain';
        var callback = function (result) {
          scope.rain.data = result;
          //$scope.rain.wkt = wkt;
          scope.rain.srs = 'EPSG:4236';
        };
        getRain(start, stop, latLng, callback);
      };

      /**
       * Gets rain from the server
       *
       * @param  {int} start    start of rainserie
       * @param  {int} stop     end of rainserie
       * @param  {function} callback function
       * @param  {object} latLng   location of rainserie in {lat: int, lng: int} (currently only supports points)
       * @param  {int} interval width of the aggregation, default: stop - start / 100
       * @param  {int} statWin   window for the min/max, default: 5 min
       */
      var getRain = function (start, stop, latLng, callback, interval, statWin) {
        var stopString = stop.toISOString().split('.')[0];
        var startString = start.toISOString().split('.')[0];
        var wkt = "POINT(" + latLng.lng + " " + latLng.lat + ")";
        if (interval === undefined) {
          interval = (stop - start) / 100;
        }
        if (statWin === undefined) {
          statWin = 300000;
        }
        CabinetService.raster.get({
          raster_names: 'rain',
          geom: wkt,
          srs: 'EPSG:4236',
          start: startString,
          stop: stopString,
          interval: interval,
          stat_win: statWin
        }).then(callback);
      };

      var cleanup = scope.$watch('tools.active', function (newVal, oldVal) {
        if (newVal === oldVal) { return; }
        if (newVal !== 'rain') {
          scope.map.off('click', rainClick);
        }
        if (scope.tools.active === 'rain') {
          scope.map.on('click', rainClick);
        }
      });
    }
  };
});