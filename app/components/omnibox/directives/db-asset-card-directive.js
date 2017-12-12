angular.module('omnibox').directive('dbAssetCard', [
  'State',
  'DataService',
  'DragService',
  'DBCardsService',
  'DashboardChartService',
  'TimeseriesService',
  'RelativeToSurfaceLevelService',
  'getNestedAssets',
  'UtilService',
  '$timeout',
  function (
    State,
    DataService,
    DragService,
    DBCardsService,
    DashboardChartService,
    TimeseriesService,
    RTSLService,
    getNestedAssets,
    UtilService,
    $timeout
  ) {
    return {

      link: function (scope, element, attrs) {

        scope.colorPickersSettings = DBCardsService.colorPickersSettings;
        scope.openColorPicker = DBCardsService.openColorPicker;
        scope.closeColorPicker = DBCardsService.closeColorPicker;

        scope.getIconClass = UtilService.getIconClass;
        scope.isNested = !!attrs.nested;
        scope.noData = scope.asset.timeseries.length === 0;
        scope.relativeTimeseries = RTSLService.relativeToSurfaceLevel;

        scope.getKeyForAssetTimeseries = DashboardChartService.getKeyForAssetTimeseries;
        scope.getKeyForRasterAsset = DashboardChartService.getKeyForRasterAsset;
        scope.isChartActive = DashboardChartService.isChartActive;
        scope.toggleChart = DashboardChartService.toggleChart;
        scope.getOrCreateChart = DashboardChartService.getOrCreateChart;

        scope.toggleColorPicker = function (tsUuid) {
          if (scope.colorPickersSettings[tsUuid]) {
            scope.closeColorPicker(tsUuid);
          } else {
            scope.openColorPicker(tsUuid);
          }
        };

        scope.toggleRelativeTimeseries = function () {
          RTSLService.toggle();
          TimeseriesService.syncTime();
        };

        scope.assetHasChildren = function (asset) {
          return getNestedAssets(asset).length > 0;
        };

        scope.state = State;

        scope.assetHasSurfaceLevel = function () {
          return ('surface_level' in scope.asset);
        };

        scope.parentAssetHasSurfaceLevel = function () {
          var parentAsset;
          var parentAssetKey;

          if (scope.asset.parentAsset) {
            parentAssetKey = scope.asset.parentAsset;
            parentAsset = DataService.getAssetByKey(parentAssetKey);
          }

          return parentAsset && ('surface_level' in parentAsset);
        };

        // Extender is the button at the bottom of the timeseries list to show
        // more or less items.

        var MANY = 3;

        scope.showExtender = scope.asset.timeseries.length > MANY;
        scope.extended = !scope.showExtender;

        scope.toggleExtended = function () {
          scope.extended = !scope.extended;
        };

        scope.showChart = function(chart, index) {
          if (!chart.description) return false;

          if (scope.extended || DashboardChartService.isChartActive(chart.uuid)) return true;

          // Scope is not extended and this chart isn't active.
          if (index >= MANY) return false;

          // First three could be shown, but active charts under it take precedence
          var activeChartsAfter = 0;
          scope.asset.timeseries.forEach(function (ts, idx) {
            var key = DashboardChartService.getKeyForAssetTimeseries(ts.uuid);
            if (idx > index && DashboardChartService.isChartActive(key)) {
              activeChartsAfter++;
            }
          });

          // Check if chart would be visible if the active charts would be placed before it
          return (index + activeChartsAfter < MANY);
        };

        $timeout(function () {
          DragService.addDraggableContainer(element.find('#drag-container'));
        });
      },
      restrict: 'E',
      scope: {
        asset: '=',
        assets: '=',
        timeState: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/db-asset-card.html'
    };
  }]);
