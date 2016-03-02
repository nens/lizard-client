'use strict';

/**
 *
 */
angular.module('dashboard')
  .directive('crossSection', ['TimeseriesService', 'CabinetService', function (TimeseriesService, CabinetService) {

    var link = function (scope, element, attrs) {

      var content = {
        line: {
          data: [],
          keys: {x:0, y:1}
        },
        points: []
      };

      var tsData = [];


      // Get timeseries data of monitoring wells
      var timeseriesIds = [];
      scope.asset.monitoring_wells.forEach(function(well) {
        if (well.timeseries[0]) {
          timeseriesIds.push(well.timeseries[0].uuid);
        }
      });


      // Get elevation
      var coords = scope.asset.geometry.coordinates;

      CabinetService.raster().get({
        raster_names: 'dem',
        srs: 'EPSG:4326',
        geom: 'LINESTRING(' + coords[0][0]
          + ' ' + coords[0][1]
          + ',' + coords[1][0]
          + ' ' + coords[1][1]
          + ')'
      }).then(function (response) {
        content.line.data = response.data;
        scope.content = content; // bind content to scope to start drawing
                                 // graph.
      });


      var getTimeseries = function (timeseries, timeState) {
        TimeseriesService
        ._getTimeseries(timeseries, timeState, TimeseriesService.minPoints)
        .then(function (result) {
          result.forEach(function (ts) {
            tsData.push(ts);
          });
          setTimeseriesToAt(tsData, timeState.at);
        });
      };

      var setTimeseriesToAt = function (timeseries, at) {
        content.points = [];
        timeseries.forEach(function (ts) {
          var i = bisect(ts.data, 'timestamp', at);
          if (i !== undefined) {

            // Get the well of timeseries.
            var well = _.find(scope.asset.monitoring_wells, function(well) {
              return _.some(well.timeseries, function (mwts) {
                return mwts.uuid === ts.id;
              });
            });

            content.points.push({
              id: ts.id,
              value: ts.data[i].value,
              x: well.profileX
            });

          }

        });
      };

      /**
       * Returns the index of the value at key in arrayObject closest to value.
       * When value is exactly in the middle, the first index is returned.
       *
       * @param  {array}        arrayOfObjects array to be searched.
       * @param  {string | int} key to compare property in arrayOfObjects.
       * @param  {int}          value to search for.
       * @return {int}          first index closest to value.
       */
      var bisect = function (arrayOfObjects, key, value) {
        var index;
        var initialSmallestDiff = Infinity;
        _.reduce(arrayOfObjects, function (smallestDiff, d, i) {
          var currentDiff = Math.abs(d[key] - value);
          if (currentDiff < smallestDiff) {
            index = i;
            smallestDiff = currentDiff;
          }
          return smallestDiff;
        }, initialSmallestDiff);
        return index;
      };

      scope.$watch('temporal.timeLineMoving', function () {
        getTimeseries(timeseriesIds, scope.temporal);
      });

      scope.$watch('temporal.at', function () {
        setTimeseriesToAt(tsData, scope.temporal.at);
      });

    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        asset: '=',
        dimensions: '=',
        temporal: '='
      },
      templateUrl: 'dashboard/crosssection.html'
    };

  }
]);
