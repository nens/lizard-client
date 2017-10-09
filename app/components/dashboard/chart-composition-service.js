angular.module('dashboard')
.service('ChartCompositionService', ['$timeout', function ($timeout) {

  var service = this;
  service.composedCharts = [];

  // Reset this svc's main data structure
  this.reset = function () {
    service.composedCharts = [];
  };

  this.getChartIndexForSelection = function (selectionUuid) {
    var chartIndex = -1,
        selectionIndex;

    service.composedCharts.forEach(function (value, index) {
      selectionIndex = value.indexOf(selectionUuid);
      if (selectionIndex > -1) {
        chartIndex = index;
      }
    });
    return chartIndex;
  };

  this.addSelection = function (chartIndex, selectionId) {
    if (chartIndex === undefined || chartIndex >= service.composedCharts.length) {
      // This will result in a single new cartesian plane with a single chart:
      console.log("Adding ", selectionId, "at new index ", chartIndex);
      service.composedCharts.push([selectionId]);
    } else {
      // This will add a new chart to an existing cartesian plane:
      console.log("Adding ", selectionId, "at existing index ", chartIndex);
      var chart;
      chart = service.composedCharts[chartIndex];
      if (chart.indexOf(selectionId) === -1) {
        chart.push(selectionId);
      }
    }
  };

  this.dragSelection = function (newChartIndex, selectionUuid) {
    var oldChartIndex = service.getChartIndexForSelection(selectionUuid);

    var result = {
      changed: false,
      mustActivateSelection: false,
      mustEmulateClick: false // If this is true, then selection is added elsewhere!
    };

    if (service.composedCharts.length === 0) {
      result.changed = true;
      result.mustActivateSelection = true;
      result.mustEmulateClick = true;
    } else if (oldChartIndex === newChartIndex) {
      // Do nothing.
    } else if (oldChartIndex !== -1) {
      this.addSelection(newChartIndex, selectionUuid);
      removeSelectionFromSpecificPlot(oldChartIndex, selectionUuid);
      result.changed = true;
      result.mustActivateSelection = (newChartIndex === service.composedCharts.length - 1);
    } else {
      if (newChartIndex !== undefined) {
        this.addSelection(newChartIndex, selectionUuid);
        result.changed = true;
        result.mustActivateSelection = true;
      }
    }
    return result;
  };

  var removeSelectionFromSpecificPlot = function (chartIndex, selectionUuid) {
    var composedChart = service.composedCharts[chartIndex];

    if (composedChart === undefined) {
      console.error("[E] plot #" + chartIndex + " is empty");
      return;
    }

    var selectionIndex = composedChart.indexOf(selectionUuid);
    if (selectionIndex === -1) {
      console.error("[E] plot #" + chartIndex + " does not have selection with uuid " + selectionUuid);
    } else {
      composedChart.splice(selectionIndex, 1);
      if (composedChart.length === 0) {
        // Remove from array.
        service.composedCharts.splice(chartIndex, 1);
      }
    }
  };

  this.removeSelection = function (selectionUuid) {
    var selectionIndex = getChartIndexForSelection(selectionUuid);
    if (selectionIndex !== -1) {
      removeSelectionFromSpecificPlot(selectionIndex, selectionUuid);
    } else {
      console.error("[E] Selection not found! Could not remove selection with uuid =", selectionUuid);
    }
  };
}]);
