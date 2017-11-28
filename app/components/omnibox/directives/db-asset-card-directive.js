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

        scope.getTsDisplayName = function (selection) {
          var metaData = {}; // scope.getSelectionMetaData(selection);
          if (metaData.parameter) {
            var neatParameter = metaData.parameter.split(",").join(", ");
            if (metaData.location) {
              return metaData.location + ", " + neatParameter;
            } else {
              return neatParameter;
            }
          } else {
            return "...";
          }
        };

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

        /**
         * Returns true if selection with uuid is one the first three in the list.
         *
         * This is used to bypass ngRepeat which loops over one big list of
         * selections multiple times, once for each asset. It should draw the
         * first three of each asset or more if more than three are active.
         *
         * @param  {str}  uuid uuid of selection.
         * @return {Boolean} is in first three of DOM list.
         */
        scope.isOneOfFirstThree = function (uuid) {
          var MAX = 3;
          var items = element.find('.draggable-ts');
          if (!items || items.length <= MAX) {
            return true;
          } else {
            var result = false;
            _.forEach(items, function (item, key) {
              if (parseInt(key) < MAX) {
                result = result || item.id === uuid;
              }
            });
            return result;
          }
        };

        // Extender is the button at the bottom of the timeseries list to show
        // more or less items.

        scope.showExtender = false;
        scope.extended = true;

        var MANY = 3;

        // If there are a few timeseries, show them all and do not show the
        // extender button.
        if (scope.asset.timeseries.length < MANY) {
          scope.showExtender = false;
        } else {
          scope.showExtender = true;
        }

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
