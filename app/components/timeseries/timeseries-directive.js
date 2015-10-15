'use strict';
/**
 * Timeseries directive.
 */
angular.module('timeseries')
  .directive('timeseries', ['TimeseriesService', '$filter', function (TimeseriesService, $filter) {
  return {
      link: function (scope) {

        var GRAPH_WIDTH = 320; // Width of drawing area of box graphs.

        scope.timeseries = {};
        scope.fetching = false;

        /**
         * Return the currently selected timeseries if it is one of the
         * available timeseries.
         * @param  {array} timeseries list of available timeseries.
         * @param  {object} current   currently selected ts.
         * @return {object} selected timeseries.
         */
        var getSelectedTS = function (timeseries, current) {
          var selected = {};
          if (current) {
            selected = timeseries.filter(function (ts) {
              return ts.uuid === current.uuid;
            });
          }
          return selected.length > 0 ? selected[0] : timeseries[0];
        };

        /**
         * Fetch timeseries for asset. Remove zero datapoints from response and
         * update the selected ts.
         * @param  {object} asset utfgrid asset with entity_name and id.
         */
        var fetchTS = function(asset) {
          scope.fetching = true;

          var assetId = asset.entity_name + '$' + asset.id;

          TimeseriesService.getTimeSeriesForObject(
            assetId,
            scope.timeState.start,
            scope.timeState.end,
            GRAPH_WIDTH
          ).then(function (response) {
            scope.timeseries.data = $filter('rmZeroDatumTimeseries')(response.results);

            scope.timeseries.selectedTimeseries = getSelectedTS(
              scope.timeseries.data,
              scope.timeseries.selectedTimeseries
            );
            scope.fetching = false;

          });
        };

        /**
         * Get new ts when asset changes
         */
        scope.$watch('asset', function () {
          fetchTS(scope.asset);
        });


        /**
         * Get new ts when time changes
         */
        scope.$watch('timeState.timelineMoving', function (off) {
          if (!off) {
            fetchTS(scope.asset);
          }
        });

      },
      restrict: 'E',
      scope: {
        asset: '=',
        fullDetails: '=',
        timeState: '='
      },
      // replace: true,
      templateUrl: 'timeseries/timeseries.html'
    };
}]);
