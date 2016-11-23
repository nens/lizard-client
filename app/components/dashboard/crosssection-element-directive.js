'use strict';

/**
 * Collects crosssection data from api and creates a graph content object.
 */
angular.module('dashboard')
.directive('crossSection', [
  'TimeseriesService',
  'CabinetService',
  'UtilService',
  function (TimeseriesService, CabinetService, UtilService) {

    var link = function (scope, element, attrs) {

      // Contains content for crosssection graph.
      var content = {
        line: {
          data: [],
          keys: {x:0, y:1}
        },
        points: []
      };

      var tsData = [];

      // Get timeseries ids of monitoring wells
      var timeseriesIds = [];
      scope.asset.monitoring_wells.forEach(function(well) {
        well.timeseries.forEach(function (ts) {
          if (ts.parameter === 'Stijghoogte') {
            timeseriesIds.push(ts.uuid);
          }
        });
      });


      // Get elevation
      var coords = scope.asset.geometry.coordinates;
      var getLineData = function(response){
        var uuid = response.results[0].uuid;
        CabinetService.raster().get({
          rasters: uuid,
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
      };
      CabinetService.rasterInfo.get({
        name: 'Hoogte'
      }).then(getLineData);

      /** Gets timeseries using TimeseriesService .*/
      var getTimeseries = function (timeseries, timeState) {
        TimeseriesService
        ._getTimeseries(timeseries, timeState, TimeseriesService.minPoints,
            "crosssections")
        .then(function (result) {
          tsData = [];
          result.forEach(function (ts) {
            tsData.push(ts);
          });
          setTimeseriesToAt(tsData, timeState.at);
        });
      };

      /**
       * Updates content to contain the data in the ts beloning to at.
       *
       * @param {array}  timeseries list of timeseries.
       * @param {int}    at         virtual now.
       */
      var setTimeseriesToAt = function (timeseries, at) {
        content.points = [];
        timeseries.forEach(function (ts) {
          var i = UtilService.bisect(ts.data, 'timestamp', at);
          if (i !== undefined) {

            // Get the well of timeseries and the ts.
            var wellTs; // stores linked property, needed to include or exclude
                        // timeseries values from cross section interpolation.
            var well = _.find(scope.asset.monitoring_wells, function(well) {
              return _.some(well.timeseries, function (mwts) {
                if (mwts.uuid === ts.id) { wellTs = mwts; }
                return mwts.uuid === ts.id;
              });
            });

            content.points.push({
              id: ts.id,
              value: ts.data[i].max,
              x: well.distance_along_crosssection,
              linked: wellTs.linked
            });

            content.points = _.sortBy(content.points, 'x');

          }
        });
      };

      scope.$watch('temporal.timelineMoving', function () {
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
