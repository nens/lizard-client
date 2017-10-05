angular.module('omnibox')
.service('DBCardsService', [
  'State',
  'DataService',
  function (State, DataService) {

  colorPickersSettings = {}

  var openColorPicker = function (tsUuid) {
    closeAllColorPickers();
    colorPickersSettings[tsUuid] = true;
  }

  var closeColorPicker = function (tsUuid) {
    colorPickersSettings[tsUuid] = false;
  }

  var closeAllColorPickers = function () {
    for (var tsUuid in colorPickersSettings) {
      colorPickersSettings[tsUuid] = false;
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
