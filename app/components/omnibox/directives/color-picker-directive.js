/**
 * @module
 * @description Directive for a color picker.
 */
angular.module('omnibox')
.directive('colorPicker', ['UtilService', 'TimeseriesService', 'DataService',
  function (UtilService, TimeseriesService, DataService) {

    var link = function(scope, element, attrs) {
      scope.colorPicker = {
        enabled: false,
        availableColors: UtilService.GRAPH_COLORS,
        selectedColor: scope.selection.color
      };

      var toggleColorPicker = function () {
        scope.colorPicker.enabled = !scope.colorPicker.enabled;
      };

      scope.toggleColorPicker = toggleColorPicker;

      scope.selectColor = function(color) {
        scope.colorPicker.selectedColor = color;
        toggleColorPicker();
      };

      scope.$watch('colorPicker.selectedColor', function() {
        scope.selection.color = scope.colorPicker.selectedColor;
        if (scope.selection.timeseries){
          TimeseriesService.onColorChange(scope.selection);
        } else {
          DataService.onColorChange(scope.selection);
        }
      });
    };

    return {
      restrict: 'AE',
      link: link,
      templateUrl: 'omnibox/templates/color-picker.html'
    };
  }
]);
