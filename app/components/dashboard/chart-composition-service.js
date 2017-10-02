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

  // TODO: this can be done more efficient
  var reorderComposedCharts = function (startIdx) {
    // console.log("[F] reorderComposedCharts; startIdx =", startIdx);
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
    console.log("[F] CCService.addSelection");
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
    ///////////////////////////////////////////////////////////////////////////
    //this.debug(); /////////////////////////////////////////////////////////////
  };

  this.dragSelection = function (newChartIndex, selectionUuid) {
    console.log("[F] CCService.dragSelection");
    var oldChartIndex = service.getChartIndexForSelection(selectionUuid);
    console.log("*** oldChartIndex...:", oldChartIndex, "(type=" + (typeof oldChartIndex) + ")");
    console.log("*** newChartIndex...:", newChartIndex, "(type=" + (typeof newChartIndex) + ")");
    var result = {
      changed: false,
      mustActivateSelection: false,
      mustEmulateClick: false
    }

    if (getNextChartIndex() === 0) {
      // console.log("...returning early (because: no charts yet)!");
      // service.addSelection(undefined, selectionUuid);
      result.changed = true
      result.mustActivateSelection = true;
      result.mustEmulateClick = true;

    } else if (oldChartIndex === newChartIndex) {
      // console.log("...returning early (because: chart was dragged into itself)!");
      result.changed = false;
      result.mustActivateSelection = false;

    } else if (oldChartIndex !== undefined) {

      // if (newChartIndex === ....HIERRRRRRRRRRRRRRR)

      // if dragging an existing selection unto the *last* plot:

      if (newChartIndex === getNextChartIndex() - 1) {
        console.log("DRAG TS INTO LAST PLOT");

        // service.removeSelection(selectionUuid);

        // $timeout(function () {
        //   service.addSelection(newChartIndex, selectionUuid);
        // });

        removeSelectionFromSpecificPlot(oldChartIndex, selectionUuid);
        service.addSelection(newChartIndex - 1, selectionUuid);

        result.changed = true;
        result.mustActivateSelection = true;

      } else {
        service.removeSelection(selectionUuid);
        service.addSelection(newChartIndex, selectionUuid);
        result.changed = true;
        result.mustActivateSelection = false;
      }

    } else {

      if (newChartIndex !== undefined) {
        var selections = service.composedCharts[intToString(newChartIndex)]
        selections = selections || [];
        selections.push(selectionUuid);
      } else {
        console.error("An unexpected error; it's such a drag");
      }
    }

    service.debug()
    return result;
  };

  var removeSelectionFromSpecificPlot = function (chartIndex, selectionUuid) {
    console.log("[F] removeSelectionFromSpecificPlot");
    console.log("*** chartIndex:", chartIndex);
    console.log("*** selectionUuid:", selectionUuid);

    var composedChart = service.composedCharts[intToString(chartIndex)];
    if (composedChart === undefined) {
      console.error("[E] @removeSelectionFromSpecificPlot: plot #" + chartIndex + " is empty");
    } else {
      var selectionIndex = composedChart.indexOf(selectionUuid);
      if (selectionIndex === -1) {
        console.error("[E] @removeSelectionFromSpecificPlot: plot #" + chartIndex + " does not have selection with uuid " + selectionUuid);
      } else {
        composedChart.splice(selectionIndex, 1);
        if (composedChart.length === 0) {
          delete service.composedCharts[chartIndex];
          reorderComposedCharts(chartIndex);
        }
      }
    }
    service.debug();
  }

  this.removeSelection = function (selectionUuid) {
    console.log("[F] CCService.removeSelection");
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
      console.error("Selection not found! Could not remove selection with uuid =", selectionUuid);
    }
    ///////////////////////////////////////////////////////////////////////////
    this.debug(); /////////////////////////////////////////////////////////////
  };

  this.debug = function () {
    console.log(">>> DEBUG <<<");
    console.log("composedCharts =", service.composedCharts);
  }

}]);