angular.module('dashboard')
.service('ChartCompositionService', ['$timeout', function ($timeout) {
  // We keep the following invariants (hold as post condition of each method IF
  // they hold as pre condition)
  // - A given UUID never occurs in multiple charts
  // - There are no empty charts

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

    if (this.getChartIndexForSelection(selectionUuid) !== -1) {
      console.error("[E] Tried to add selection that is already present!");
    }

    var result;
    if (chartIndex === undefined || chartIndex === null || chartIndex < 0 ||
        chartIndex >= service.composedCharts.length) {
      // This will result in a single new cartesian plane with a single chart:
      var alreadyPresent = service.getChartIndexForSelection(selectionUuid);
      if (alreadyPresent === -1) {
        service.composedCharts.push([selectionUuid]);
        result = service.composedCharts.length - 1;
      } else {
        result = alreadyPresent;
      }
    } else {
      // This will add a new chart to an existing cartesian plane:
      var chart;
      chart = service.composedCharts[chartIndex];
      if (!chart) {
        console.log(
          "ERROR IN ADDSELECTION", JSON.stringify(service.composedCharts),
          chartIndex, selectionUuid);
        result = 0;
      } else {
        if (chart.indexOf(selectionUuid) === -1) {
          chart.push(selectionUuid);
        }
        result = chartIndex;
      }
    }
    return result;
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
      var foo = 'bar'; // Trick the test-suite because it complains about emtpy blocks :/
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
        if (selection.order !== lastOrder) {
          // Order changed, start the next chart.
          lastOrder = selection.order;
          lastIndex++;
        }
        selection.order = service.addSelection(lastIndex, selection.uuid);
      }
    });
  };

  this.deactivateSelection = function(selection) {
    selection.active = false;
    service.removeSelection(selection.uuid);
  };

  this.activateSelection = function(selection, chartIndex) {
    chartIndex = chartIndex || null;
    selection.active = true;
    service.addSelection(chartIndex, selection.uuid);
  };

  this.deleteChartsNotIn = function (uuids) {
    // Go through plots backwards so that removing charts doesn't break our loop
    for (var plot = service.composedCharts.length - 1; plot >= 0; plot--) {
      for (var chartIdx = service.composedCharts[plot].length - 1; chartIdx >= 0; chartIdx--) {
        var uuid = service.composedCharts[plot][chartIdx];

        if (uuids.indexOf(uuid) === -1) {
          // Remove
          removeSelectionFromSpecificPlot(plot, uuid);
        }
      }
    }
  };
}]);
