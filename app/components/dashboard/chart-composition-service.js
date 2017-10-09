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

  this.addSelection = function (chartIndex, selectionUuid) {
    // Returns the index of the chart that selectionUuid was inserted into.
    if (chartIndex === undefined || chartIndex >= service.composedCharts.length) {
      // This will result in a single new cartesian plane with a single chart:
      service.composedCharts.push([selectionUuid]);
      return service.composedCharts.length - 1;
    } else {
      // This will add a new chart to an existing cartesian plane:
      var chart;
      chart = service.composedCharts[chartIndex];
      if (!chart) {
        console.log(
          "ERROR IN ADDSELECTION", JSON.stringify(service.composedCharts),
          chartIndex, selectionUuid);
        return 0;
      } else {
        if (chart.indexOf(selectionUuid) === -1) {
          chart.push(selectionUuid);
        }
        return chartIndex;
      }
    }
  };

  this.dragSelection = function (newChartIndex, selectionUuid) {
    var oldChartIndex = service.getChartIndexForSelection(selectionUuid);

    var result = {
      finalIndex: -1,
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

    result.finalIndex = service.getChartIndexForSelection(selectionUuid);
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
    var selectionIndex = service.getChartIndexForSelection(selectionUuid);
    if (selectionIndex !== -1) {
      removeSelectionFromSpecificPlot(selectionIndex, selectionUuid);
    } else {
      console.error("[E] Selection not found! Could not remove selection with uuid =", selectionUuid);
    }
  };

  this.setMultipleSelections = function (selections) {
    this.reset();
    // Copy here so that we don't sort the global State.selections unnecessarily.
    selections = selections.slice();
    var selectionsWithIndex = selections.map(function (selection, index) {
      return [selection, index];
    });

    // Sort them by 'order' so that we insert the ones with the lowest order first.
    // If orders are equal, sort by index to have a stable sort.
    selectionsWithIndex.sort(function (a, b) {
      if (a[0].order === b[0].order) {
        // Sort by index.
        return a[1] - b[1];
      } else {
        // Sort by order.
        return a[0].order - b[0].order;
      }
    });

    var lastIndex = -1; // Chart index at which the selection will be inserted
    var lastOrder = -1; // Last order seen, to check if this one has a different order
    selectionsWithIndex.forEach(function (selectionWithIndex) {
      var selection = selectionWithIndex[0];
      if (selection.active) {
        // Deal correctly with missing orders; e.g. if there are two selections, both
        // with order 2, insert both at index 0.
        if (selection.order != lastOrder) {
          // Order changed, start the next chart.
          lastOrder = selection.order;
          lastIndex++;
        }
        service.addSelection(lastIndex, selection.uuid);
      }
    });
  };
}]);
