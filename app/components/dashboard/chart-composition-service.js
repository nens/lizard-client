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

  this.getChartIndex = function (chartKey) {
    for (var plot=0; plot < service.composedCharts.length; plot++) {
      var idx = service.composedCharts[plot].indexOf(chartKey);
      if (idx !== -1) return idx;
    }
    return -1;
  }

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
    return service.getChartIndex(key) !== -1;
  };

  this.addChart = function (chartIndex, chartKey) {
    // Returns the index of the chart that chartKey was inserted into.

    if (this.getChartIndex(chartKey) !== -1) {
      console.error("[E] Tried to add chart that is already present!");
    }

    var result;
    if (chartIndex === undefined || chartIndex === null || chartIndex < 0 ||
        chartIndex >= service.composedCharts.length) {
      // This will result in a single new cartesian plane with a single chart:
      var alreadyPresent = service.getChartIndex(chartKey);
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
          "ERROR IN ADDCHART", JSON.stringify(service.composedCharts),
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

  this.dragChart = function (newChartIndex, chartKey) {
    var oldChartIndex = service.getChartIndex(chartKey);

    if (oldChartIndex === newChartIndex) {
      // NOP.
      return;
    }

    if (oldChartIndex === -1) {
      // New chart.
      this.addChart(newChartIndex, chartKey);
    } else {
      // First add, then remove, so chart indices don't change between the two.
      this.addChart(newChartIndex, chartKey);
      removeChartFromSpecificPlot(oldChartIndex, chartKey);
    }
  };

  var removeChartFromSpecificPlot = function (chartIndex, chartKey) {
    var composedChart = service.composedCharts[chartIndex];

    if (composedChart === undefined) {
      console.error("[E] plot #" + chartIndex + " is empty");
      return;
    }

    var idx = composedChart.indexOf(chartKey);
    if (idx === -1) {
      console.error("[E] plot #" + chartIndex + " does not have chart with key " + chartKey);
    } else {
      composedChart.splice(idx, 1);
      if (composedChart.length === 0) {
        // Remove from array.
        service.composedCharts.splice(chartIndex, 1);
      }
    }
  };

  this.removeChart = function (chartKey) {
    var idx = service.getChartIndex(chartKey);
    if (idx !== -1) {
      removeChartFromSpecificPlot(idx, chartKey);
    }
  };

  this.deleteChartsNotIn = function (uuids) {
    // Go through plots backwards so that removing charts doesn't break our loop
    for (var plot = service.composedCharts.length - 1; plot >= 0; plot--) {
      for (var chartIdx = service.composedCharts[plot].length - 1; chartIdx >= 0; chartIdx--) {
        var uuid = service.composedCharts[plot][chartIdx];

        if (uuids.indexOf(uuid) === -1) {
          // Remove
          removeChartFromSpecificPlot(plot, uuid);
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
