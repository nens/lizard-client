'use strict';

/**
 *
 */
angular.module('dashboard')
  .directive('crossSection', ['TimeseriesService', 'CabinetService', function (TimeseriesService, CabinetService) {

    var link = function (scope, element, attrs) {
      console.log(scope.asset);

      scope.content = [];

      var content = { data: [], keys: {} };

      var coords = scope.asset.geometry.coordinates;

      // Get elevation
      CabinetService.raster().get({
        raster_names: 'dem',
        srs: 'EPSG:4326',
        geom: 'LINESTRING(' + coords[0][0]
          + ' ' + coords[0][1]
          + ',' + coords[1][0]
          + ' ' + coords[1][1]
          + ')'
      }).then(function (response) {
        content.type = 'elevation';
        content.data = response.data;
        scope.content.push(content);
      });

      // Get timeseries data of monitoring wells
      var timeseries = [];
      scope.asset.monitoring_wells.forEach(function(well) {
        if (well.timeseries[0]) {
          timeseries.push(well.timeseries[0].uuid);
        }
      });

      TimeseriesService
      ._getTimeseries(timeseries, scope.temporal, TimeseriesService.minPoints)
      .then(function (result) {
        result.forEach(function (ts) {
          ts.contentType = 'well';
          scope.content.push(ts);
        });
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
