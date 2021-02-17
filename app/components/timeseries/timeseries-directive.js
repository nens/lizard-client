'use strict';
/**
 * Timeseries directive.
 */

angular.module('timeseries')
.directive('timeseries', [
  '$timeout',
  'gettextCatalog',
  'notie',
  'State',
  'TimeseriesService',
  function (
    $timeout,
    gettextCatalog,
    notie,
    State,
    TimeseriesService
  ) {
  return {
    link: function (scope) {
      scope.zoomToInterval = TimeseriesService.zoomToInterval;
      scope.state = State; // TODO: only done this to watch state.layers. There is a better place for this.

      scope.$on('$destroy', function () {
          TimeseriesService.syncTime();
        });
    },
    restrict: 'E', // Timeseries can be an element with single-select or
                    // multi select as an attribute or without in which
                    // case it only sets the color and order of timeseries of
                    // new assets.
    scope: true // Share scope with select directive
  };
}]);

/**
 * Timeseries directive.
 */
angular.module('timeseries')
.config([ // stop the sanitation -- > SO: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page
  '$compileProvider',
  function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http):/);
  }])


.directive('timeseriesSingleSelect', ['$http', 'State', 'TimeseriesService',
  'gettextCatalog', 'notie', 'ChartCompositionService', 'AssetService',
  function ($http, State, TimeseriesService, gettextCatalog, notie, ChartCompositionService, AssetService) {
  return {
    link: function (scope) {
      var selectTimeseries = function () {
        var assetKey = AssetService.getAssetKey(scope.asset);
        var selected = (
          State.selectedForAssets[assetKey] || {});
        selected.timeseries = scope.timeseries.selected;
        State.selectedForAssets[assetKey] = selected;

        _.forEach(
          TimeseriesService.syncTime(),
          function (tsPromise) {
            tsPromise.then(getContentForAsset);
          }
        );

      };

      var getContentForAsset = function (timeseries) {
        // Timeseries contains all still active timeseries events, select
        // only the one relating to this asset.
        scope.content = timeseries.filter(function (ts) {
          return _.some(scope.asset.timeseries, {uuid: ts.id});
        });
      };

      var firstTimeseries = (
        scope.asset.timeseries && scope.asset.timeseries.length ?
        scope.asset.timeseries[0] : {uuid: 'empty'}
      );
      scope.timeseries = {
        selected: {uuid: 'empty'},
        change: function () {
          selectTimeseries();
        }
      };

      scope.$watch('asset', function (aG) {
        if(scope.asset) {
          scope.timeseries.selected = scope.asset.timeseries[0];
          scope.timeseries.change();
        }});

      /**
       * Get new ts when time changes
       */
      scope.$watch('timeState.timelineMoving', function (newValue, oldValue) {
        if (!newValue && newValue !== oldValue) {
          _.forEach(TimeseriesService.syncTime(),
            function (tsPromise) {
              tsPromise.then(getContentForAsset);
          });
          }
      });
      scope.orderedTimeseries = scope.asset.timeseries.sort(function(a,b){
        var aTotal = (a.location + ', '+ a.parameter).toLowerCase();
        var bTotal = (b.location + ', '+ b.parameter).toLowerCase();
        if (aTotal > bTotal) {
          return 1;
        } else if (aTotal < bTotal) {
          return -1;
        } else {
          return 0;
        }
      });
    },
    restrict: 'A',
    templateUrl: 'timeseries/timeseries.html',
    scope: true // Share scope with timeseries directive
  };
}]);
