/**
 * @module
 * @description Directive for a color picker.
 */
angular.module('omnibox')
<<<<<<< HEAD
.directive('colorPicker', ['UtilService', 'TimeseriesService', 'DBCardsService',
  function (UtilService, TimeseriesService, DBCardsService) {
=======
.directive('colorPicker', ['UtilService', 'TimeseriesService', 'DataService',
  function (UtilService, TimeseriesService, DataService) {
>>>>>>> 448da3c0af3160dcf5b0381ccc5795d4a4e3dcba

    var link = function(scope, element, attrs) {
      scope.colorPicker = {
        enabled: false,
        availableColors: UtilService.GRAPH_COLORS,
        selectedColor: scope.selection.color
      };

      scope.openColorPicker = function (index) {
        scope.colorPicker.enabled = true;
        DBCardsService.openColorPicker(index);
      };

      scope.closeColorPicker = function (index) {
        scope.colorPicker.enabled = false;
        DBCardsService.closeColorPicker(index);
      };

      scope.selectColor = function(color) {
        scope.colorPicker.selectedColor = color;
        scope.closeColorPicker(attrs.index);
      };

      scope.$watch('colorPicker.selectedColor', function() {
        scope.selection.color = scope.colorPicker.selectedColor;
        if (scope.selection.timeseries){
          TimeseriesService.onColorChange(scope.selection);
        } else {
          DataService.onColorChange(scope.selection);
        }
      });

      scope.colorPickersSettings = DBCardsService.colorPickersSettings;

      scope.$watch('colorPickersSettings[' + attrs.index + ']', function (n) {
        scope.colorPicker.enabled = n;
      });
    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'omnibox/templates/color-picker.html'
    };
  }
]);
