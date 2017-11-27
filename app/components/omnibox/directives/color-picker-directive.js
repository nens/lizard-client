/**
 * @module
 * @description Directive for a color picker.
 */
angular.module('omnibox')
.directive('colorPicker',
           ['UtilService', 'TimeseriesService', 'DataService', 'DBCardsService',
             'DashboardChartService', function (
               UtilService, TimeseriesService, DataService, DBCardsService, DashboardChartService) {

    var link = function(scope, element, attrs) {
      var chart = DashboardChartService.getOrCreateChart(attrs.chartKey);

      scope.colorPicker = {
        availableColors: UtilService.GRAPH_COLORS,
        selectedColor: chart.color
      };

      scope.openColorPicker = function (tsUuid) {
        scope.colorPicker.enabled = true;
        DBCardsService.openColorPicker(tsUuid);
      };

      scope.closeColorPicker = function (tsUuid) {
        scope.colorPicker.enabled = false;
        DBCardsService.closeColorPicker(tsUuid);
      };

      scope.selectColor = function(color) {
        scope.colorPicker.selectedColor = color;
        chart.color = color;
        scope.closeColorPicker(chart.uuid);
      };

      scope.$watch('colorPicker.selectedColor', function() {
        chart.color = scope.colorPicker.selectedColor;
        if (chart.timeseries){
          TimeseriesService.onColorChange(chart);
        } else {
          DataService.onColorChange(chart);
        }
      });

      scope.colorPickersSettings = DBCardsService.colorPickersSettings;
      scope.$watch('colorPickersSettings["' + chart.uuid + '"]', function (n) {
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
