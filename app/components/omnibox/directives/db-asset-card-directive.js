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
        scope.extended = false;

        scope.toggleExtended = function () {
          scope.extended = !scope.extended;
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
