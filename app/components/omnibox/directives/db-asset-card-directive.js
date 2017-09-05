angular.module('omnibox').directive('dbAssetCard', [
  'State',
  'DataService',
  'DragService',
  'DBCardsService',
  'SelectionService',
  'TimeseriesService',
  'RelativeToSurfaceLevelService',
  function (
    State,
    DataService,
    DragService,
    DBCardsService,
    SelectionService,
    TimeseriesService,
    RTSLService
  ) {
    return {
      link: function (scope, element) {

        scope.noData = scope.asset.timeseries.length === 0;
        scope.relativeTimeseries = RTSLService.relativeToSurfaceLevel;

        scope.toggleRelativeTimeseries = function () {
          RTSLService.toggle();
          TimeseriesService.syncTime();
        };

<<<<<<< HEAD
angular.module('omnibox')
       .directive('dbAssetCard', [
         'State', 'DataService', 'DragService', 'DBCardsService',
         'TimeseriesService', 'AssetService', 'RelativeToSurfaceLevelService',
         function (State, DataService, DragService, DBCardsService,
                   TimeseriesService, AssetService, RTSLService) {
  return {
    link: function (scope, element) {

      scope.selected = State.selected;
      scope.relativeTimeseries = RTSLService.relativeToSurfaceLevel;
      scope.assetIsNested = AssetService.assetIsNested;

      // scope.isColorPickerEnabled = function (index) {
      //   // return index === DBCardsService.colorPickerEnabled.index
      //   //   && DBCardsService.colorPickerEnabled.value;
      //   return DBCardsService.colorPickerEnabled[index];
      // };

      scope.colorPickersSettings = DBCardsService.colorPickersSettings;
      scope.openColorPicker = DBCardsService.openColorPicker
      scope.closeColorPicker = DBCardsService.closeColorPicker;

      scope.toggleColorPicker = function (index) {
        if (scope.colorPickersSettings[index]) {
          scope.closeColorPicker(index);
        } else {
          scope.openColorPicker(index);
        }
      }

      scope.assetIsNested = function (asset) {
        var assetName = asset.entity_name + "$" + asset.id;
        var allNestedAssetNames = AssetService.getAllNestedAssetNames();
        return allNestedAssetNames.indexOf(assetName) > -1;
      };

      scope.toggleRelativeTimeseries = function () {
        RTSLService.toggle();
        TimeseriesService.syncTime();
      };

      scope.getTsMetaData = function (uuid) {
        return _.find(scope.asset.timeseries, function (ts) {
          return ts.uuid === uuid;
        });
      };

      scope.getTsLongName = function (uuid) {
        var metaData = scope.getTsMetaData(uuid);
        return metaData.location + ',' + metaData.parameter;
      };

      scope.getTsShortName = function (uuid) {
        var metaData = scope.getTsMetaData(uuid);
        var splitted = metaData.parameter.split(",");
        return splitted.join(", ");
      };

      scope.assetHasSurfaceLevel = function () {
        return ('surface_level' in scope.asset);
      };

      scope.parentAssetHasSurfaceLevel = function () {
=======
        scope.state = State;
        scope.getSelectionMetaData = SelectionService.getMetaDataFunction(
          scope.asset);
        scope.toggleSelection = SelectionService.toggle;
>>>>>>> 448da3c0af3160dcf5b0381ccc5795d4a4e3dcba

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

<<<<<<< HEAD
        } else {
          DBCardsService.removeItemFromPlot(timeseries);
        }

        timeseries.active = !timeseries.active;
        TimeseriesService.syncTime();
      };

      scope.noTimeseries = scope.asset.timeseries.length === 0;

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
=======
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
>>>>>>> 448da3c0af3160dcf5b0381ccc5795d4a4e3dcba

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
