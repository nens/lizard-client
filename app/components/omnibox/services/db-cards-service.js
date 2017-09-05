angular.module('omnibox')
.service('DBCardsService', [
  'State',
  'DataService',
  function (State, DataService) {

  colorPickersSettings = {}

  var openColorPicker = function (index) {
    closeAllColorPickers();
    colorPickersSettings[index] = true;
  }

  var closeColorPicker = function (index) {
    colorPickersSettings[index] = false;
  }

  var closeAllColorPickers = function () {
    for (var idx in colorPickersSettings) {
      colorPickersSettings[idx] = false;
    }
  }

  /**
   * Loops over all the items that can be plotted and return the count and the
   * highest order.
   *
   * @return {{count: int, order: int}}
   */
  var getActiveCountAndOrder = function () {

    var orders = [];
    var actives = 0;

    _.forEach(
      State.selections,
      function (selection) {
        if (selection.active) {
          actives++;
          orders.push(selection.order);
        }
      }
    );

    DataService.assets.forEach(function (asset) {

      if (asset.entity_name === 'leveecrosssection' &&
        asset.crosssection.active) {
        actives++;
        orders.push(asset.crosssection.order);
      }
    });

    return {
      count: actives,
      order: _.max(orders)
    };

  };

  var removeSelectionFromPlot = function (selectedItem) {
    var order = selectedItem.order;
    var selectionsInChart = 0;
    var uuid = selectedItem.uuid;

    // Check if it was the last selection in the chart.
    selectionsInChart += _.filter(
      State.selections,
      function (selection) {
        return selection.active && selection.order === order &&
          selection.uuid !== uuid;
      }
    ).length;

    if (selectionsInChart === 0) {
      State.selections.forEach(function (selection) {
        if (selection.order > order) {
          selection.order--;
        }
      });

      // deal with this for Crossections sake.
      // TODO: also make crossections into a proper selection
      DataService.assets.forEach(function (asset) {
        if (asset.entity_name === 'leveecrosssection' &&
          asset.crosssection.active && asset.crosssection.order > order) {
          asset.crosssection.order--;
        }
      });

    }

  };

  return {
    getActiveCountAndOrder: getActiveCountAndOrder,
<<<<<<< HEAD
    removeItemFromPlot: removeItemFromPlot,
    // colorPickerEnabled: colorPickerEnabled,
    // toggleColorPicker: toggleColorPicker
    colorPickersSettings: colorPickersSettings,
    openColorPicker: openColorPicker,
    closeColorPicker: closeColorPicker,
    closeAllColorPickers: closeAllColorPickers
=======
    removeSelectionFromPlot: removeSelectionFromPlot
>>>>>>> 448da3c0af3160dcf5b0381ccc5795d4a4e3dcba
  };

}]);
