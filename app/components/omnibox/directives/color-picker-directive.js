/**
 * @module
 * @description Directive for a color picker.
 */
angular.module('omnibox')
.directive('colorPicker', ['UtilService', 'TimeseriesService', 'DataService', 'DBCardsService',
  function (UtilService, TimeseriesService, DataService, DBCardsService) {

    var link = function(scope, element, attrs) {
      scope.colorPicker = {
        enabled: false,
        availableColors: UtilService.GRAPH_COLORS,
        selectedColor: scope.selection.color
      };

      // var toggleColorPicker = function () {
      //   scope.colorPicker.enabled = !scope.colorPicker.enabled;
      // };

      // scope.toggleColorPicker = toggleColorPicker;

      scope.openColorPicker = function (tsUuid) {
        console.log("[F] colorPickerDirective.openColorPicker");
        scope.colorPicker.enabled = true;
        DBCardsService.openColorPicker(tsUuid);
      };

      scope.closeColorPicker = function (tsUuid) {
        scope.colorPicker.enabled = false;
        DBCardsService.closeColorPicker(tsUuid);
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
      scope.$watch('colorPickersSettings["' + attrs.index + '"]', function (n) {
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
