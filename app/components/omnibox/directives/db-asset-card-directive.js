angular.module('omnibox').directive('dbAssetCard', [
  'State',
  'DataService',
  'DragService',
  'DBCardsService',
  'SelectionService',
  'TimeseriesService',
  'RelativeToSurfaceLevelService',
  'AssetService',
  'getNestedAssets',
  'UtilService',
  function (
    State,
    DataService,
    DragService,
    DBCardsService,
    SelectionService,
    TimeseriesService,
    RTSLService,
    AssetService,
    getNestedAssets,
    UtilService
  ) {
    return {
      link: function (scope, element) {

        scope.noData = scope.asset.timeseries.length === 0;
        scope.relativeTimeseries = RTSLService.relativeToSurfaceLevel;

        scope.colorPickersSettings = DBCardsService.colorPickersSettings;
        scope.openColorPicker = DBCardsService.openColorPicker
        scope.closeColorPicker = DBCardsService.closeColorPicker;
        scope.getNestedAssets = getNestedAssets;

        scope.getIconClass = UtilService.getIconClass;

        scope.toggleColorPicker = function (tsUuid) {
          if (scope.colorPickersSettings[tsUuid]) {
            scope.closeColorPicker(tsUuid);
          } else {
            scope.openColorPicker(tsUuid);
          }
        }

        scope.assetIsNested = function (asset) {
          return !!asset.parentAsset;
        };

        scope.assetHasChildren = function (asset) {
          var nestedAssets = getNestedAssets(asset);
          return nestedAssets.length > 0;
        };

        scope.toggleRelativeTimeseries = function () {
          RTSLService.toggle();
          TimeseriesService.syncTime();
        };

        scope.state = State;
        scope.getSelectionMetaData = SelectionService.getMetaDataFunction(
          scope.asset);
        scope.toggleSelection = SelectionService.toggle;

        scope.getSelectionForTS = function (tsUuid) {
          // console.log("[F] getSelectionForTS");
          // console.log("*** arg 'tsUuid':", tsUuid);
          // console.log("*** State.selections:", State.selections);
          var result = _.find(State.selections, { timeseries: tsUuid });
          // console.log("*** result:", result);
          return result;
        }

        scope.getTsLongName = function (selection) {
          var metaData = scope.getSelectionMetaData(selection);
          return metaData.location + ',' + metaData.parameter;
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

        scope.getTsShortName = function (ts) {
          var splitted = ts.parameter.split(",");
          var result = splitted.join(", ");
          return result || '...';
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

        scope.noTimeseries = scope.asset.timeseries.length === 0;

        /**
         * Specific toggle for crosssection
         *
         * @param  {object} asset with entity_name crossection and a crossection
         *                        model.
         */
        scope.toggleCrosssection = function (asset) {

          if (!asset.crosssection.active) {
            var plots = DBCardsService.getActiveCountAndOrder();

            asset.crosssection.order = plots.count > 0
                                     ? plots.order + 1
                                     : 0;

            asset.crosssection.active = true;

          } else {
            DBCardsService.removeSelectionFromPlot(asset.crosssection);
            asset.crosssection.active = false;
          }

          if (DataService.onGeometriesChange) {
            DataService.onGeometriesChange();
          }
        };

        // Init crosssection
        if (scope.asset.entity_name === 'leveecrosssection') {
          scope.asset.crosssection = {
            active: false, // set to true by  toggle
            order: 0
          };
          scope.toggleCrosssection(scope.asset);
        }
        DragService.addDraggableContainer(element.find('#drag-container'));

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
