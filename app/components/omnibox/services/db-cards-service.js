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

  return {
    colorPickersSettings: colorPickersSettings,
    openColorPicker: openColorPicker,
    closeColorPicker: closeColorPicker,
    closeAllColorPickers: closeAllColorPickers
  };
}]);
