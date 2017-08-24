/**
 * @module
 * @description Directive for a color picker.
 */
angular.module('omnibox')
.directive('colorPicker', ['UtilService', 'TimeseriesService', 'DBCardsService',
  function (UtilService, TimeseriesService, DBCardsService) {

    var link = function(scope, element, attrs) {
      scope.colorPicker = {
        enabled: false,
        availableColors: UtilService.GRAPH_COLORS,
        selectedColor: scope.ts.color
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
        scope.ts.color = scope.colorPicker.selectedColor;
        TimeseriesService.onColorChange(scope.ts);
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
