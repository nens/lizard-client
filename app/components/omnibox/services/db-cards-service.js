angular.module('omnibox')
.service('DBCardsService', [
  'State',
  'DataService',
  function (State, DataService) {

  colorPickersSettings = {}

  var openColorPicker = function (key) {
    closeAllColorPickers();
    colorPickersSettings[key] = true;
  }

  var closeColorPicker = function (key) {
    colorPickersSettings[key] = false;
  }

  var closeAllColorPickers = function () {
    for (var key in colorPickersSettings) {
      colorPickersSettings[key] = false;
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

  return {
    getActiveCountAndOrder: getActiveCountAndOrder,

    colorPickersSettings: colorPickersSettings,
    openColorPicker: openColorPicker,
    closeColorPicker: closeColorPicker,
    closeAllColorPickers: closeAllColorPickers
  };

}]);
