angular.module('dashboard')
.service('ChartCompositionService', ['$timeout', function ($timeout) {
  // We keep the following invariants (hold as post condition of each method IF
  // they hold as pre condition)
  // - A given UUID never occurs in multiple charts
  // - There are no empty charts

  var service = this;

  // Keeps the actual chart objects. Kept here so that other modules can inject it
  // to READ from its contents (to go from key to chart object), but
  // only DashboardChartService is allowed to WRITE this variable.
  service.dashboardCharts = {};

  // Array of plots that contain chart keys, keeps track of which chart
  // is in which plot.
  // If chart key is not present in composedCharts, then it is not active.
  service.composedCharts = [];

  // Only use this function if you are sure the chart key exists -- e.g., if you
  // got it from the composedCharts.
  this.getChartByKey = function (key) {
    return service.dashboardCharts[key];
  };

  this.chartsPresent = function () {
    return service.composedCharts.length > 0;
  }

  // Reset this svc's main data structure
  this.reset = function () {
    service.composedCharts = [];
  };

  this.getChartIndexForSelection = function (chartKey) {
    var chartIndex = -1,
        selectionIndex;

    service.composedCharts.forEach(function (value, index) {
      selectionIndex = value.indexOf(chartKey);
      if (selectionIndex > -1) {
        chartIndex = index;
      }
    });
    return chartIndex;
  };

  this.getActiveCharts = function () {
    var charts = [];
    service.composedCharts.forEach(function (plot) {
      plot.forEach(function (key) {
        charts.push(service.dashboardCharts[key]);
      });
    });
    return charts;
  };

  this.isKeyActive = function (key) {
    return service.getChartIndexForSelection(key) !== -1;
  };

  this.addSelection = function (chartIndex, chartKey) {
    // Returns the index of the chart that chartKey was inserted into.

    if (this.getChartIndexForSelection(chartKey) !== -1) {
      console.error("[E] Tried to add selection that is already present!");
    }

    var result;
    if (chartIndex === undefined || chartIndex === null || chartIndex < 0 ||
        chartIndex >= service.composedCharts.length) {
      // This will result in a single new cartesian plane with a single chart:
      var alreadyPresent = service.getChartIndexForSelection(chartKey);
      if (alreadyPresent === -1) {
        service.composedCharts.push([chartKey]);
        result = service.composedCharts.length - 1;
      } else {
        result = alreadyPresent;
      }
    } else {
      // This will add a new chart to an existing cartesian plane:
      var chart;
      chart = service.composedCharts[chartIndex];
      if (!chart) {
        console.error(
          "ERROR IN ADDSELECTION", JSON.stringify(service.composedCharts),
          chartIndex, chartKey);
        result = 0;
      } else {
        if (chart.indexOf(chartKey) === -1) {
          chart.push(chartKey);
        }
        result = chartIndex;
      }
    }
    return result;
  };

  this.dragSelection = function (newChartIndex, chartKey) {
    var oldChartIndex = service.getChartIndexForSelection(chartKey);

    if (oldChartIndex === newChartIndex) {
      // NOP.
      return;
    }

    if (oldChartIndex === -1) {
      // New chart.
      this.addSelection(newChartIndex, chartKey);
    } else {
      // First add, then remove, so chart indices don't change between the two.
      this.addSelection(newChartIndex, chartKey);
      removeSelectionFromSpecificPlot(oldChartIndex, chartKey);
    }
  };

  var removeSelectionFromSpecificPlot = function (chartIndex, chartKey) {
    var composedChart = service.composedCharts[chartIndex];

    if (composedChart === undefined) {
      console.error("[E] plot #" + chartIndex + " is empty");
      return;
    }

    var selectionIndex = composedChart.indexOf(chartKey);
    if (selectionIndex === -1) {
      console.error("[E] plot #" + chartIndex + " does not have selection with uuid " + chartKey);
    } else {
      composedChart.splice(selectionIndex, 1);
      if (composedChart.length === 0) {
        // Remove from array.
        service.composedCharts.splice(chartIndex, 1);
      }
    }
  };

  this.removeSelection = function (chartKey) {
    var selectionIndex = service.getChartIndexForSelection(chartKey);
    if (selectionIndex !== -1) {
      removeSelectionFromSpecificPlot(selectionIndex, chartKey);
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

  this.checkDrag = function(chartKey, plotNumber) {
    // Returns an error message if this drag is not OK, null if it is
    // Bar charts cannot be combined.
    if (service.composedCharts[plotNumber] && service.composedCharts[plotNumber].length) {
      var chart = service.dashboardCharts[chartKey];
      var existingChartKey = service.composedCharts[plotNumber][0];
      var existingChart = service.dashboardCharts[existingChartKey];

      if (chart.measureScale === 'ratio' || existingChart.measureScale === 'ratio') {
        return 'Whoops, bar charts cannot be combined. Try again!';
      }
    }

    return null;
  };

}]);
