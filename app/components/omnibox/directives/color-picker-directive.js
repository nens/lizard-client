/**
 * @module
 * @description Directive for a color picker.
 */
angular.module('omnibox')
.directive('colorPicker', ['UtilService', 'TimeseriesService',
                           function (UtilService, TimeseriesService) {

  var link = function(scope, element, attrs) {
    scope.colorPicker = {
      enabled: false,
      availableColors: UtilService.GRAPH_COLORS,
      selectedColor: scope.s.color
    }

    var toggleColorPicker = function () {
      scope.colorPicker.enabled = !scope.colorPicker.enabled;
    };

    scope.toggleColorPicker = toggleColorPicker;

    scope.selectColor = function(color) {
      scope.colorPicker.selectedColor = color;
      toggleColorPicker();
    }

    scope.$watch('colorPicker.selectedColor', function() {
      scope.s.color = scope.colorPicker.selectedColor;
      TimeseriesService.onColorChange(scope.s);
    });
  };

  return {
    restrict: 'AE',
    link: link,
    templateUrl: 'omnibox/templates/color-picker.html'
  };
}]);
