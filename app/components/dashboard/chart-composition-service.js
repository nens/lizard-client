angular.module('dashboard')
.service('ChartCompositionService', ['$timeout', function ($timeout) {

  var service = this;
  service.composedCharts = {};

  var getNextChartIndex = function () {
    return Object.keys(service.composedCharts).length;
  }

  var intToString = function (n) {
    return "" + n;
  };

  var isEmpty = function () {
    return getNextChartIndex() === 0;
  };

  var reorderComposedCharts = function (startIdx) {
    var reorderedComposedCharts = {},
        i = 0;
    _.forEach(service.composedCharts, function (v, k) {
      if (i++ < startIdx) {
        reorderedComposedCharts[k] = v;
      } else {
        reorderedComposedCharts[intToString(parseInt(k) - 1)] = v;
      }
    });
    service.composedCharts = reorderedComposedCharts;
  }

  this.getChartIndexForSelection = function (selectionUuid) {
    var chartIndex,
        selectionIndex;

    _.forEach(service.composedCharts, function (v, k) {
      selectionIndex = v.indexOf(selectionUuid);
      if (selectionIndex > -1) {
        chartIndex = parseInt(k);
      }
    });
    return chartIndex;
  }

  this.addSelection = function (chartIndex, selectionId) {
    var chartKey,
        chartValue;

    if (chartIndex === undefined) {
      // This will result in a single new cartesian plane with a single chart:
      chartKey = intToString(getNextChartIndex());
      chartValue = [];
    } else {
      // This will add a new chart to an existing cartesian plane:
      chartKey = intToString(chartIndex);
      chartValue = service.composedCharts[chartKey] || [];
    }
    chartValue.push(selectionId);
    service.composedCharts[chartKey] = chartValue;
  };

  this.dragSelection = function (newChartIndex, selectionUuid) {
    var oldChartIndex = service.getChartIndexForSelection(selectionUuid);
    var result = {
      changed: false,
      mustActivateSelection: false,
      mustEmulateClick: false
    }

    if (getNextChartIndex() === 0) {
      result.changed = true
      result.mustActivateSelection = true;
      result.mustEmulateClick = true;

    } else if (oldChartIndex === newChartIndex) {
      result.changed = false;
      result.mustActivateSelection = false;

    } else if (oldChartIndex !== undefined) {

      if (newChartIndex === getNextChartIndex() - 1) {

        var countA = getNextChartIndex();
        removeSelectionFromSpecificPlot(oldChartIndex, selectionUuid);
        var countB = getNextChartIndex();

        if (countA === countB) {
          // No plots were deleted
          service.addSelection(newChartIndex, selectionUuid);
        } else if (countA === countB + 1) {
          // One plot was deleted
          service.addSelection(newChartIndex - 1, selectionUuid);
        }

        result.changed = true;
        result.mustActivateSelection = true;

      } else {
        var countA = getNextChartIndex();
        service.removeSelection(selectionUuid);
        var countB = getNextChartIndex();

        if (countA === countB) {
          // No plots were deleted
          service.addSelection(newChartIndex, selectionUuid);

        } else if (countA === countB + 1) {
          // One plot was deleted
          var correctedChartIndex;
          if (oldChartIndex < newChartIndex) {
            correctedChartIndex = newChartIndex - 1;
          } else {
            correctedChartIndex = newChartIndex;
          }
          service.addSelection(correctedChartIndex, selectionUuid);
        }

        result.changed = true;
        result.mustActivateSelection = false;
      }

    } else {
      if (newChartIndex !== undefined) {
        var selections = service.composedCharts[intToString(newChartIndex)]
        selections = selections || [];
        selections.push(selectionUuid);
      }
    }
    return result;
  };

  var removeSelectionFromSpecificPlot = function (chartIndex, selectionUuid) {
    var composedChart = service.composedCharts[intToString(chartIndex)];

    if (composedChart === undefined) {
      console.error("[E] plot #" + chartIndex + " is empty");
    } else {
      var selectionIndex = composedChart.indexOf(selectionUuid);
      if (selectionIndex === -1) {
        console.error("[E] plot #" + chartIndex + " does not have selection with uuid " + selectionUuid);
      } else {
        composedChart.splice(selectionIndex, 1);
        if (composedChart.length === 0) {
          delete service.composedCharts[chartIndex];
          reorderComposedCharts(chartIndex);
        }
      }
    }
  }

  this.removeSelection = function (selectionUuid) {
    var selectionIndex,
        someSelectionWasRemoved = false;

    _.forEach(service.composedCharts, function (v, k) {
      selectionIndex = v.indexOf(selectionUuid);
      if (selectionIndex > -1) {
        v.splice(selectionIndex, 1);
        someSelectionWasRemoved = true;
        if (v.length === 0) {
          delete service.composedCharts[k];
          reorderComposedCharts(parseInt(k));
        }
      }
    });
    if (!someSelectionWasRemoved) {
      console.error("[E] Selection not found! Could not remove selection with uuid =", selectionUuid);
    }
  };

  this.debug = function () {
    console.log(">>> DEBUG <<<");
    console.log("composedCharts =", JSON.stringify(service.composedCharts));
  }

}]);