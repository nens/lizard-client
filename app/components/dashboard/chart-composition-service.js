angular.module('dashboard')
.service('ChartCompositionService', function () {

  var service = this;
  service.composedCharts = {};

  var getNextChartIndex = function () {
    return Object.keys(service.composedCharts).length;
  }

  var intToString = function (n) {
    return "" + n;
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
    var chartIndex;
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
      console.log("Add to NEW cartesian plane");
      chartKey = intToString(getNextChartIndex());
      chartValue = [];
    } else {
      console.log("Add to OLD cartesian plane");
      // This will add a new chart to an existing cartesian plane:
      chartKey = intToString(chartIndex);
      chartValue = service.composedCharts[chartKey] || [];
    }
    chartValue.push(selectionId);
    service.composedCharts[chartKey] = chartValue;
    ///////////////////////////////////////////////////////////////////////////
    this.debug(); /////////////////////////////////////////////////////////////
  };

  this.dragSelection = function (newChartIndex, selectionUuid) {
    console.log("[F] CCService.dragSelection");
    var oldChartIndex = service.getChartIndexForSelection(selectionUuid);
    // console.log("*** oldChartIndex...:", oldChartIndex, "(type=" + (typeof oldChartIndex) + ")");
    // console.log("*** newChartIndex...:", newChartIndex, "(type=" + (typeof newChartIndex) + ")");
    if (getNextChartIndex() === 0) {
      // console.log("...returning early (because: no charts yet)!");
      return false;
    } else if (oldChartIndex === newChartIndex) {
      // console.log("...returning early (because: chart was dragged into itself)!");
      return false;
    } else if (oldChartIndex !== undefined) {
      service.removeSelection(selectionUuid);
    }
    service.addSelection(newChartIndex, selectionUuid);
    return true;
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

});