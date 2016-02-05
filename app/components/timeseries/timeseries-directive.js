'use strict';
/**
 * Timeseries directive.
 */
angular.module('timeseries')
  .directive('timeseries', ['TimeseriesService',
    function (TimeseriesService) {
  return {
      link: function (scope) {

        /**
         * Fetch timeseries for asset. Remove zero datapoints from response and
         * update the selected ts.
         * @param  {object} asset utfgrid asset with entity_name and id.
         */
        var fetchTS = function(asset) {
          var assetId = asset.entity_name + '$' + asset.id;

          var prom = TimeseriesService.getTimeSeriesForAsset(asset);

          prom.then(function (asset) {
            scope.asset = asset;
          });
        };

        /**
         * Get new ts when asset changes
         */
        scope.$watch('asset', function () {
          fetchTS(scope.asset);
        });

      },
      restrict: 'E', // Timeseries can be an element with single-select or
                      // multi select as as an attribute or without in which
                      // case it only collects the ts metadata.
    };
}]);

/**
 * Timeseries directive.
 */
angular.module('timeseries')
  .directive('timeseriesSingleSelect', ['State', 'TimeseriesService',
    function (State, TimeseriesService) {
  return {
      link: function (scope) {

        scope.fetching = false;

        var selectTimeseries = function () {
          State.selected.timeseries = [scope.timeseries.selected.uuid];
        };

        scope.content = TimeseriesService;

        scope.timeseries = {
          selected: {},
          change: function () {
           selectTimeseries(scope.timeseries.selected);
          }
        };

        /** timeseries are asynchronous so we set a default selection when
         *  they are set.
         */
        var watchTimeseries = scope.$watch('asset.timeseries', function (n, o) {
          if (n) {
            scope.timeseries.selected = scope.asset.timeseries[0];
            scope.timeseries.change();
            watchTimeseries(); // rm watch
          }
        });

        /**
         * Get new ts when time changes
         */
        scope.$watch('timeState.timelineMoving', function (newValue, oldValue) {
          if (!newValue && newValue !== oldValue) {
            TimeseriesService.syncTime();
          }
        });

      },
      restrict: 'A',
      templateUrl: 'timeseries/timeseries.html'
    };
}]);

